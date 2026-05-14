// EOQ Service — semua fungsi kalkulasi EOQ, Safety Stock, ROP, Total Cost
// Model: Wilson (Economic Order Quantity)

const Z_SCORE = { 90: 1.28, 95: 1.65, 97: 1.88, 99: 2.33 };

function getZ(service_level) {
  return Z_SCORE[Number(service_level)] ?? 1.65;
}

// EOQ = √(2DS / H)
// Jika S = 0 atau H = 0 atau D = 0 → tidak bisa dihitung, return null
function hitungEOQ(D, S, H) {
  if (!S || S <= 0 || !H || H <= 0 || !D || D <= 0) return null;
  return Math.sqrt((2 * D * S) / H);
}

// SS = Z × σ × √LT
function hitungSafetyStock(service_level, sigma, lead_time) {
  const Z = getZ(service_level);
  return Z * (sigma || 0) * Math.sqrt(lead_time || 1);
}

// ROP = (d × LT) + SS
function hitungROP(demand_harian, lead_time, safety_stock) {
  return (demand_harian || 0) * (lead_time || 1) + safety_stock;
}

// TC = (D/Q × S) + (Q/2 × H)
// Jika EOQ null → TC null
function hitungTotalCost(D, S, eoq, H) {
  if (!eoq || eoq <= 0) return null;
  return (D / eoq) * S + (eoq / 2) * H;
}

// Kalkulasi lengkap — return nilai yang disimpan ke DB
function kalkulasiLengkap(obat) {
  const D = parseFloat(obat.demand_tahunan) || 0;
  const S = parseFloat(obat.biaya_pesan) || 0;
  const H = parseFloat(obat.biaya_simpan) || 0;
  const d = parseFloat(obat.demand_harian) || 0;
  const sigma = parseFloat(obat.std_dev_demand) || 0;
  const LT = parseInt(obat.lead_time) || 1;
  const sl = obat.service_level || 95;

  const eoq = hitungEOQ(D, S, H);
  const safety_stock = hitungSafetyStock(sl, sigma, LT);
  const rop = hitungROP(d, LT, safety_stock);
  const total_biaya = hitungTotalCost(D, S, eoq, H);

  return {
    eoq: eoq !== null ? parseFloat(eoq.toFixed(2)) : null,
    safety_stock: parseFloat(safety_stock.toFixed(2)),
    rop: parseFloat(rop.toFixed(2)),
    total_biaya: total_biaya !== null ? parseFloat(total_biaya.toFixed(2)) : null,
  };
}

// Step-by-step untuk tampilan skripsi
function kalkulasiStepByStep(obat) {
  const D = parseFloat(obat.demand_tahunan) || 0;
  const S = parseFloat(obat.biaya_pesan) || 0;
  const H = parseFloat(obat.biaya_simpan) || 0;
  const d = parseFloat(obat.demand_harian) || 0;
  const sigma = parseFloat(obat.std_dev_demand) || 0;
  const LT = parseInt(obat.lead_time) || 1;
  const sl = obat.service_level || 95;
  const Z = getZ(sl);

  // ── Langkah EOQ ─────────────────────────────────────────────────────────
  let langkah_eoq;
  if (S <= 0) {
    langkah_eoq = {
      rumus: 'EOQ = √(2 × D × S / H)',
      substitusi: `EOQ = √(2 × ${D} × 0 / ${H})`,
      hasil: null,
      catatan: 'Biaya pemesanan (S) = 0. Model EOQ Wilson tidak dapat diterapkan. Kebijakan pemesanan menggunakan ROP sebagai acuan pemesanan ulang.',
    };
  } else if (H <= 0) {
    langkah_eoq = {
      rumus: 'EOQ = √(2 × D × S / H)',
      substitusi: `EOQ = √(2 × ${D} × ${S} / 0)`,
      hasil: null,
      catatan: 'Biaya penyimpanan (H) = 0. Tidak dapat membagi dengan nol.',
    };
  } else {
    const eoqRaw = Math.sqrt((2 * D * S) / H);
    langkah_eoq = {
      rumus: 'EOQ = √(2 × D × S / H)',
      substitusi: `EOQ = √(2 × ${D} × ${S} / ${H})`,
      langkah: `EOQ = √(${(2 * D * S).toFixed(0)} / ${H}) = √${((2 * D * S) / H).toFixed(4)}`,
      hasil: parseFloat(eoqRaw.toFixed(2)),
    };
  }

  // ── Langkah Safety Stock ─────────────────────────────────────────────────
  const sqrtLT = Math.sqrt(LT);
  const ssRaw = Z * sigma * sqrtLT;
  const langkah_safety_stock = {
    rumus: 'SS = Z × σ × √LT',
    substitusi: `SS = ${Z} × ${sigma} × √${LT}`,
    langkah: `SS = ${Z} × ${sigma} × ${sqrtLT.toFixed(4)}`,
    hasil: parseFloat(ssRaw.toFixed(2)),
  };

  // ── Langkah ROP ─────────────────────────────────────────────────────────
  const ropRaw = d * LT + ssRaw;
  const langkah_rop = {
    rumus: 'ROP = (d × LT) + SS',
    substitusi: `ROP = (${d} × ${LT}) + ${ssRaw.toFixed(2)}`,
    langkah: `ROP = ${(d * LT).toFixed(2)} + ${ssRaw.toFixed(2)}`,
    hasil: parseFloat(ropRaw.toFixed(2)),
  };

  // ── Langkah Total Cost ───────────────────────────────────────────────────
  let langkah_tc;
  const eoqFinal = langkah_eoq.hasil;
  if (!eoqFinal || S <= 0) {
    langkah_tc = {
      rumus: 'TC = (D/Q × S) + (Q/2 × H)',
      substitusi: 'Tidak berlaku karena S = 0',
      hasil: null,
      catatan: 'Total biaya tidak relevan karena tidak ada biaya pemesanan (S = 0).',
    };
  } else {
    const biayaPersan = (D / eoqFinal) * S;
    const biayaSimpan = (eoqFinal / 2) * H;
    const tcRaw = biayaPersan + biayaSimpan;
    langkah_tc = {
      rumus: 'TC = (D/Q × S) + (Q/2 × H)',
      substitusi: `TC = (${D}/${eoqFinal} × ${S}) + (${eoqFinal}/2 × ${H})`,
      langkah: `TC = ${biayaPersan.toFixed(2)} + ${biayaSimpan.toFixed(2)}`,
      hasil: parseFloat(tcRaw.toFixed(2)),
    };
  }

  return {
    obat: { id: obat.id, nama: obat.nama, kode: obat.kode },
    input: { D, S, H, LT, Z, sigma, demand_harian: d },
    langkah_eoq,
    langkah_safety_stock,
    langkah_rop,
    langkah_tc,
  };
}

module.exports = { kalkulasiLengkap, kalkulasiStepByStep, getZ };
