require('dotenv').config();
const ExcelJS = require('exceljs');
const pool = require('../src/db/pool');

function cellValue(cell) {
  let v = cell.value;
  if (v && typeof v === 'object') {
    if (v.richText) v = v.richText.map((t) => t.text).join('');
    else if (v instanceof Date) return v;
    else if (v.result !== undefined) v = v.result;
    else return null;
  }
  return v;
}

// Alias untuk nama generik/singkatan umum yang beda ejaan dari nama di database
// (mis. ejaan internasional vs Indonesia, singkatan apotek lazim).
const ALIAS = [
  [/\bdexamethasone\b/g, 'dexametason'],
  [/\bm\.?\s*tawon\b/g, 'minyak tawon'],
  [/\bpct\b/g, 'paracetamol'],
  [/\bctm\b/g, 'ctm'],
  [/\bgg\b/g, 'gg'],
  [/\bbtl\b/g, 'botol'],
  [/\bstr\b|\bstp\b/g, 'strip'],
  [/\bsch\b/g, 'sachet'],
  [/\bmetilprednisolon\b/g, 'methylprednisolon'],
  [/\bomeprazol\b/g, 'omeprazole'],
  [/\blansoprazol\b/g, 'lansoprazole'],
  [/\bsutra\s*ok\b/g, 'sutra'],
];

function normalize(s) {
  let out = String(s || '').toLowerCase();
  for (const [pattern, repl] of ALIAS) out = out.replace(pattern, repl);
  return out
    .replace(/[0-9]+\s*(mg|ml|g|gr|y|x\d+)?/gi, '')
    .replace(/[^a-z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Ekstrak angka dosis/ukuran (mg, ml, g, mg/ml, atau desimal koma seperti "0,75")
// sebagai fitur TERPISAH dari nama kata — supaya "Dexa 0,5" dan "Dexa 0,75" tidak
// dianggap identik hanya karena nama katanya sama (normalize() membuang semua angka).
function extractDoses(s) {
  const str = String(s || '').replace(',', '.');
  const matches = str.match(/\d+(\.\d+)?\s*(mg|ml|g|gr)?/gi) || [];
  return matches.map((m) => parseFloat(m)).filter((n) => !isNaN(n) && n > 0);
}

// Kata varian (rasa/aroma/warna) yang membedakan produk SEJENIS tapi BEDA item
// (mis. Freshcare strong vs Freshcare citrus, Antangin merah vs Antangin JRG).
// Kalau kedua sisi sama-sama punya kata varian yang terdeteksi tapi beda, itu
// produk berbeda walau nama dasarnya sama — harus didiskualifikasi, bukan cuma turun skor.
const VARIAN_WORDS = [
  'hot', 'citrus', 'strong', 'merah', 'hijau', 'kuning', 'putih', 'matcha',
  'fruity', 'jahe', 'jeruk', 'nipis', 'mint', 'menthol', 'orange', 'straw',
  'strawberry', 'cherry', 'anak', 'dewasa', 'dws',
];

function extractVarian(s) {
  const words = normalize(s).split(' ');
  return words.filter((w) => VARIAN_WORDS.includes(w));
}

// Kata generik yang muncul di banyak nama obat berbeda (bentuk sediaan, dosis
// umum, dll) — tidak boleh jadi satu-satunya dasar match, karena "tab"/"syr"
// cocok ke puluhan obat tak terkait (mis. "Ketoconazole tab" vs "Alpara TAB").
const STOPWORDS = new Set([
  'tab', 'tablet', 'syr', 'syrup', 'sirup', 'kapsul', 'caps', 'strip', 'botol',
  'tube', 'sachet', 'krim', 'cream', 'cr', 'dus', 'box', 'pcs', 'drop', 'gel',
  'sakit', 'kepala', 'obat',
]);

function tokenOverlap(a, b) {
  const ta = new Set(normalize(a).split(' ').filter((w) => w.length > 2 && !STOPWORDS.has(w)));
  const tb = new Set(normalize(b).split(' ').filter((w) => w.length > 2 && !STOPWORDS.has(w)));
  if (ta.size === 0 || tb.size === 0) return 0;
  let common = 0;
  for (const t of ta) if (tb.has(t)) common++;
  let score = common / Math.max(ta.size, tb.size);

  // Penalti/bonus dosis: kalau KEDUA sisi punya angka dosis yang terdeteksi,
  // dan tidak ada satu pun yang cocok persis → ini kemungkinan varian dosis
  // yang salah (mis. 0,5mg vs 0,75mg), turunkan skor drastis supaya tidak menang.
  const dosesA = extractDoses(a);
  const dosesB = extractDoses(b);
  if (dosesA.length > 0 && dosesB.length > 0) {
    const adaYangCocok = dosesA.some((da) => dosesB.some((db) => Math.abs(da - db) < 0.01));
    if (!adaYangCocok) score *= 0.3; // tetap bisa match tapi kalah dari kandidat dosis yang benar
  }

  // Diskualifikasi total kalau kedua sisi punya kata varian (rasa/warna/aroma)
  // yang terdeteksi tapi TIDAK ADA yang sama — ini produk berbeda, bukan typo.
  const varianA = extractVarian(a);
  const varianB = extractVarian(b);
  if (varianA.length > 0 && varianB.length > 0) {
    const adaVarianCocok = varianA.some((va) => varianB.includes(va));
    if (!adaVarianCocok) return 0;
  }

  return score;
}

async function main() {
  const { rows: obatList } = await pool.query('SELECT id, nama, satuan FROM obat ORDER BY nama');

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('../docs/data-apotek/Transkrip_Penjualan_Oktober_2026.xlsx');
  const ws = wb.getWorksheet('Semua Data');

  const matched = [];
  const unmatched = [];

  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const keyakinan = cellValue(row.getCell(10));
    if (keyakinan === 'Tidak terbaca' || !keyakinan) continue;

    const tulisanAsli = cellValue(row.getCell(5));
    const namaTebakan = cellValue(row.getCell(6));
    const jumlah = cellValue(row.getCell(7));
    const satuan = cellValue(row.getCell(8));
    const harga = cellValue(row.getCell(9));
    const tanggal = cellValue(row.getCell(2));

    if (!tulisanAsli) continue;

    let best = null;
    let bestScore = 0;
    for (const o of obatList) {
      const score = Math.max(tokenOverlap(namaTebakan, o.nama), tokenOverlap(tulisanAsli, o.nama));
      if (score > bestScore) {
        bestScore = score;
        best = o;
      }
    }

    const entry = {
      row: r, tanggal, tulisanAsli, namaTebakan, jumlah, satuan, harga, keyakinan,
      bestMatch: best?.nama, bestScore: bestScore.toFixed(2), obatId: best?.id,
    };

    if (bestScore >= 0.6) matched.push(entry);
    else unmatched.push(entry);
  }

  console.log('Total baris diproses (Jelas+Ragu):', matched.length + unmatched.length);
  console.log('Match otomatis (score >= 0.5):', matched.length);
  console.log('Tidak match otomatis:', unmatched.length);

  console.log('\n=== Distribusi obat yang ter-match (top 20) ===');
  const freq = {};
  matched.forEach((m) => { freq[m.bestMatch] = (freq[m.bestMatch] || 0) + 1; });
  Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, v]) => console.log(v, k));

  console.log('\n=== Contoh UNMATCHED (20 pertama) ===');
  unmatched.slice(0, 20).forEach((u) => console.log(`row ${u.row}: "${u.tulisanAsli}" / "${u.namaTebakan}" (${u.keyakinan})`));

  await pool.end();

  const outDir = 'C:/Users/ASUS/AppData/Local/Temp/claude/d--skripsi-new-simo/083bec47-c947-410d-9fdf-ba490cd505b7/scratchpad';
  require('fs').writeFileSync(`${outDir}/matched.json`, JSON.stringify(matched, null, 2));
  require('fs').writeFileSync(`${outDir}/unmatched.json`, JSON.stringify(unmatched, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
