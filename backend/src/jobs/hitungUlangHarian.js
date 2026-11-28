const { hitungUlangSemua } = require('../services/stokService');

// Hitung ulang harian (keputusan Boss 28 Nov 2026): jendela data permintaan bergeser tiap hari, jadi
// d, σ, D, EOQ, ROP semua obat dihitung ulang pukul 00.05 WIB. Juga sekali saat server menyala,
// supaya hari yang terlewat (server mati/deploy ulang) tetap tertutup. Matikan dengan HITUNG_ULANG_HARIAN=off.
const SATU_HARI = 24 * 60 * 60 * 1000;
const WIB = 7 * 60 * 60 * 1000;

async function jalankan(sebab) {
  try {
    const t0 = Date.now();
    const h = await hitungUlangSemua();
    console.log(`Hitung ulang ${sebab}: ${h.jumlah - h.gagal}/${h.jumlah} obat, jendela ${h.jendela.awal} s.d. ${h.jendela.akhir} (n=${h.jendela.n}), ${Date.now() - t0} ms`);
  } catch (err) {
    console.error(`Hitung ulang ${sebab} gagal:`, err.message);
  }
}

function msSampaiBerikutnya() {
  const sekarangWib = Date.now() + WIB;
  const target = Math.floor(sekarangWib / SATU_HARI) * SATU_HARI + 5 * 60 * 1000; // 00.05 WIB hari ini
  return (target > sekarangWib ? target : target + SATU_HARI) - sekarangWib;
}

function mulaiHitungUlangHarian() {
  if (String(process.env.HITUNG_ULANG_HARIAN || '').toLowerCase() === 'off') return;
  setTimeout(() => jalankan('saat server menyala'), 10 * 1000).unref();
  const jadwalkan = () => {
    setTimeout(async () => {
      await jalankan('harian');
      jadwalkan();
    }, msSampaiBerikutnya()).unref();
  };
  jadwalkan();
}

module.exports = { mulaiHitungUlangHarian, msSampaiBerikutnya };
