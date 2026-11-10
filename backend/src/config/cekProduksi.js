// Pemeriksaan konfigurasi saat server menyala. Di produksi (NODE_ENV=production) server menolak
// berjalan dengan konfigurasi berbahaya, daripada diam-diam jalan dengan rahasia lemah.
// Di pengembangan hanya memberi peringatan, tidak menghentikan server.

function cekKonfigurasi(env = process.env) {
  const masalah = [];
  const secret = env.JWT_SECRET || '';
  if (secret.length < 32) masalah.push('JWT_SECRET kosong atau kurang dari 32 karakter');
  if (/ganti_dengan|changeme|rahasia|secret_key|password/i.test(secret)) {
    masalah.push('JWT_SECRET masih berisi nilai contoh / placeholder');
  }
  if (!env.DATABASE_URL) masalah.push('DATABASE_URL belum diisi');
  if (!env.FRONTEND_URL) masalah.push('FRONTEND_URL belum diisi (CORS akan memblokir frontend produksi)');
  else if (/localhost|127\.0\.0\.1/.test(env.FRONTEND_URL)) masalah.push('FRONTEND_URL masih menunjuk localhost');
  return masalah;
}

function terapkan(env = process.env) {
  const masalah = cekKonfigurasi(env);
  if (!masalah.length) return;
  if (env.NODE_ENV === 'production') {
    console.error('KONFIGURASI PRODUKSI TIDAK AMAN, server tidak dijalankan:');
    masalah.forEach((m) => console.error('  - ' + m));
    process.exit(1);
  }
  console.warn('Peringatan konfigurasi (tidak menghentikan server di mode pengembangan):');
  masalah.forEach((m) => console.warn('  - ' + m));
}

module.exports = { cekKonfigurasi, terapkan };
