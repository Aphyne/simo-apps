// Menjalankan SEMUA uji browser lalu menggabungkannya jadi SATU laporan web.
//   1. uji per peran  (jalankan-uji-peran.js, server dev port 3000, project "peran")
//   2. suite e2e      (jalankan-e2e.js --build, project desktop-1366 / hp-390 / ... alur)
//   3. gabung         -> hasil/laporan-gabungan  (buka: npx playwright show-report hasil/laporan-gabungan)
//
//   node jalankan-semua.js               -> semua uji + laporan gabungan
//   node jalankan-semua.js --arsip       -> plus salinan bertanggal di hasil/arsip/laporan-YYYY-MM-DD (titik penting:
//                                           sebelum merge/deploy, bahan bimbingan)
//   node jalankan-semua.js --tanpa-build -> suite e2e memakai build .next yang sudah ada
//   node jalankan-semua.js --gabung-saja -> tidak menjalankan uji; hanya menggabungkan hasil mentah (hasil/blob-peran,
//                                           hasil/blob-e2e) dari uji yang dijalankan terpisah sebelumnya
// Pantau: Get-Content hasil\semua.log -Wait -Tail 30 (bila dijalankan dengan `> hasil\semua.log 2>&1`).
//
// Port 3000 harus kosong (matikan dulu `npm run dev`): suite e2e membangun frontend ke folder .next yang sama.
// Folder .next hasil build uji dihapus di akhir supaya server dev berikutnya mulai bersih.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const HASIL = path.join(ROOT, 'hasil');
const FE_NEXT = path.join(ROOT, '..', 'simo', '.next');
const BLOB = { peran: path.join(HASIL, 'blob-peran'), e2e: path.join(HASIL, 'blob-e2e') };
const GABUNG_BLOB = path.join(HASIL, 'blob-gabungan');
const LAPORAN = path.join(HASIL, 'laporan-gabungan');
const PW = path.join(ROOT, 'node_modules/@playwright/test/cli.js');

const argv = process.argv.slice(2);
const arsip = argv.includes('--arsip');
const gabungSaja = argv.includes('--gabung-saja');
const tanpaBuild = argv.includes('--tanpa-build') || gabungSaja;

async function port3000Terpakai() {
  try { await fetch('http://localhost:3000/', { redirect: 'manual' }); return true; } catch { return false; }
}
function jalankan(label, skrip, args = []) {
  console.log(`\n========== ${label} ==========\n`);
  const r = spawnSync(process.execPath, [path.join(ROOT, skrip), ...args], { cwd: ROOT, stdio: 'inherit' });
  return r.status ?? 1;
}
const menit = (ms) => `${(ms / 60000).toFixed(1)} menit`;

(async () => {
  const mulai = Date.now();
  let kodePeran = 0;
  let kodeE2e = 0;
  if (!gabungSaja) {
    if (await port3000Terpakai()) {
      console.error('GAGAL: port 3000 sedang dipakai (server dev?). Matikan dulu `npm run dev`, lalu ulangi.');
      process.exit(1);
    }
    for (const d of Object.values(BLOB)) fs.rmSync(d, { recursive: true, force: true });
    kodePeran = jalankan('1/3 Uji per peran (44)', 'jalankan-uji-peran.js');
    kodeE2e = jalankan('2/3 Suite seluruh sistem (151)', 'jalankan-e2e.js', tanpaBuild ? [] : ['--build']);
  }
  fs.rmSync(GABUNG_BLOB, { recursive: true, force: true });

  console.log('\n========== 3/3 Menggabungkan laporan ==========\n');
  fs.mkdirSync(GABUNG_BLOB, { recursive: true });
  let adaBlob = 0;
  for (const d of Object.values(BLOB)) {
    if (!fs.existsSync(d)) { console.log(`  peringatan: ${path.relative(ROOT, d)} tidak ada (uji ini tidak sampai jalan)`); continue; }
    for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.zip'))) { fs.copyFileSync(path.join(d, f), path.join(GABUNG_BLOB, f)); adaBlob++; }
  }
  let ringkas = null;
  if (adaBlob) {
    fs.rmSync(LAPORAN, { recursive: true, force: true });
    const jsonOut = path.join(HASIL, 'laporan-gabungan.json');
    const m = spawnSync(process.execPath, [PW, 'merge-reports', '--config', path.join(ROOT, 'playwright.gabung.config.js'), '--reporter', 'html,json', GABUNG_BLOB], {
      cwd: ROOT, stdio: 'inherit',
      env: { ...process.env, PLAYWRIGHT_HTML_OUTPUT_DIR: LAPORAN, PLAYWRIGHT_HTML_OPEN: 'never', PLAYWRIGHT_JSON_OUTPUT_NAME: jsonOut },
    });
    if (m.status === 0 && fs.existsSync(jsonOut)) ringkas = JSON.parse(fs.readFileSync(jsonOut, 'utf8')).stats;
    if (arsip && fs.existsSync(LAPORAN)) {
      const tgl = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD waktu lokal
      const tujuan = path.join(HASIL, 'arsip', `laporan-${tgl}`);
      fs.rmSync(tujuan, { recursive: true, force: true });
      fs.cpSync(LAPORAN, tujuan, { recursive: true });
      console.log(`  arsip: ${path.relative(ROOT, tujuan)}`);
    }
  }

  // Build uji menanam alamat API uji; hapus supaya `npm run dev` berikutnya tidak memakai sisa build ini.
  if (!tanpaBuild && !(await port3000Terpakai())) fs.rmSync(FE_NEXT, { recursive: true, force: true });

  console.log('\n========== RINGKASAN ==========');
  if (!gabungSaja) {
    console.log(`  uji per peran : ${kodePeran === 0 ? 'LULUS' : 'ADA YANG GAGAL'}`);
    console.log(`  suite e2e     : ${kodeE2e === 0 ? 'LULUS' : 'ADA YANG GAGAL'}`);
  }
  if (ringkas) {
    const total = ringkas.expected + ringkas.unexpected + ringkas.flaky + ringkas.skipped;
    console.log(`  gabungan      : ${total} skenario | lulus ${ringkas.expected} | gagal ${ringkas.unexpected} | tidak stabil ${ringkas.flaky} | dilewati ${ringkas.skipped}`);
  }
  console.log(`  durasi        : ${menit(Date.now() - mulai)}`);
  console.log('  laporan       : npx playwright show-report hasil/laporan-gabungan');
  if (!ringkas) console.log('  GAGAL menggabungkan laporan (lihat pesan di atas)');
  const kode = kodePeran || kodeE2e || (ringkas ? (ringkas.unexpected ? 1 : 0) : 1);
  console.log(`SELESAI exit=${kode}`);
  process.exit(kode);
})();
