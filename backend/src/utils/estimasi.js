// Estimasi stok habis (hari) — satu-satunya rumus yang dipakai di semua endpoint.
// Aturan pembulatan: DIBULATKAN KE BAWAH (Math.floor) — konservatif: stok 25 dan demand 10/hari
// = 2 hari, bukan 3. Stok 0 → 0 hari. Demand kosong/0/negatif/NaN → null (tidak bisa diestimasi),
// tidak pernah NaN atau Infinity.
function hitungEstimasiHabis(stok, demand_harian) {
  const d = parseFloat(demand_harian);
  if (!Number.isFinite(d) || d <= 0) return null;
  const s = parseFloat(stok);
  if (!Number.isFinite(s) || s <= 0) return 0;
  return Math.floor(s / d);
}

module.exports = { hitungEstimasiHabis };
