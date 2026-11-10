// Validator input bersama. Tujuan: menolak NaN / Infinity / negatif / teks di kolom angka
// dengan 400 yang jelas — bukan lolos ke database lalu jadi 500 atau (lebih buruk) tersimpan.

// Error yang membawa status HTTP; ditangkap di controller dan dibalas apa adanya.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const PG_INT_MAX = 2147483647;

// Angka bulat positif (>= 1). Menerima number atau string digit murni ("5"), menolak
// "5.7", "5abc", "1e999", NaN, Infinity. Mengembalikan angkanya, atau null kalau tidak valid.
function bulatPositif(v, max = PG_INT_MAX) {
  if (typeof v === 'string' && /^\d+$/.test(v.trim())) v = Number(v.trim());
  if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 1 || v > max) return null;
  return v;
}

// ID database (bulat positif, muat di integer PostgreSQL).
const idValid = (v) => bulatPositif(v, PG_INT_MAX);

// Angka desimal berhingga, min <= n <= max. Menerima number atau string numerik biasa.
function angkaDalamRentang(v, min, max) {
  if (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim())) v = Number(v.trim());
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) return null;
  return v;
}
const desimalPositif = (v, max = 1e9) => {
  const n = angkaDalamRentang(v, 0, max);
  return n !== null && n > 0 ? n : null;
};
const nonNegatif = (v, max = 1e12) => angkaDalamRentang(v, 0, max);

// Tanggal 'YYYY-MM-DD' yang benar-benar ada di kalender, tahun 2000–2100.
// Menolak "infinity", "abc", "2026-02-31", dan format lain.
function tanggalValid(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const [y, m, d] = v.split('-').map(Number);
  if (y < 2000 || y > 2100) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return v;
}

// Periksa sekumpulan field angka pada body. Field yang tidak dikirim / kosong dilewati;
// yang dikirim harus angka berhingga dalam rentang (dan bulat bila int). Mengembalikan pesan
// error pertama, atau null kalau semua valid.
//   spec: { namaField: { min, max, int, label } }
function periksaAngka(body, spec) {
  for (const [f, o] of Object.entries(spec)) {
    const nilai = body ? body[f] : undefined;
    if (nilai === undefined || nilai === null || nilai === '') continue;
    const min = o.min ?? 0;
    const max = o.max ?? 1e12;
    const n = angkaDalamRentang(nilai, min, max);
    if (n === null || (o.int && !Number.isInteger(n))) {
      return `${o.label || f} harus berupa angka ${o.int ? 'bulat ' : ''}antara ${min} dan ${max}`;
    }
  }
  return null;
}

// Kode error PostgreSQL yang sebenarnya kesalahan input klien (bukan bug server).
const PG_KLIEN = {
  '23503': [400, 'Data referensi (mis. supplier atau obat) tidak ditemukan'],
  '23502': [400, 'Ada data wajib yang kosong'],
  '23514': [400, 'Nilai tidak memenuhi aturan data'],
  '22P02': [400, 'Format data tidak valid'],
  '22003': [400, 'Angka di luar batas yang diizinkan'],
  '22007': [400, 'Format tanggal tidak valid'],
  '22008': [400, 'Tanggal tidak valid'],
  '22001': [400, 'Teks terlalu panjang'],
  '23505': [409, 'Data sudah ada (duplikat)'],
  '23001': [409, 'Data masih dipakai oleh data lain sehingga tidak bisa dihapus'],
};

// Balas HttpError / error input dari database dengan status 4xx; kembalikan true kalau sudah dibalas.
// Error lain (bug / koneksi) tidak disentuh → controller membalas 500 seperti biasa.
function balasHttpError(err, res) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ success: false, message: err.message });
    return true;
  }
  const peta = err && PG_KLIEN[err.code];
  if (peta) {
    res.status(peta[0]).json({ success: false, message: peta[1] });
    return true;
  }
  return false;
}

module.exports = { periksaAngka, HttpError, bulatPositif, idValid, desimalPositif, nonNegatif, angkaDalamRentang, tanggalValid, balasHttpError };
