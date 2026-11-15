// Paginasi untuk endpoint daftar (GET /obat, /barang-masuk, /barang-keluar).
//
// Biasa: page dan limit, limit dibatasi 100 per permintaan (limit lebih besar DIPOTONG diam-diam,
// bukan ditolak, jadi klien yang meminta limit=9999 hanya mendapat 100 baris).
//
// `semua=true`: tanpa paginasi, untuk halaman yang menghitung ringkasan dan grafik dari seluruh riwayat
// di sisi klien. Dibatasi BATAS_SEMUA baris sebagai pagar; `meta.total` tetap jumlah sebenarnya, jadi
// klien bisa membandingkannya dengan banyaknya baris yang diterima.
const BATAS_SEMUA = 20000;

function bacaPaginasi(query) {
  const semua = query.semua === 'true' || query.semua === '1';
  if (semua) {
    return { semua: true, page: 1, limit: BATAS_SEMUA, offset: 0 };
  }
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 15));
  return { semua: false, page, limit, offset: (page - 1) * limit };
}

function metaPaginasi({ semua, page, limit }, total, jumlahBaris) {
  return {
    current_page: page,
    per_page: semua ? jumlahBaris : limit,
    total,
    last_page: semua ? 1 : Math.ceil(total / limit) || 1,
  };
}

module.exports = { bacaPaginasi, metaPaginasi, BATAS_SEMUA };
