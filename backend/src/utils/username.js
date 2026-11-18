// Aturan username login (keputusan Boss, 18 Nov 2026):
//  - boleh huruf besar dan kecil, angka, titik, garis bawah, tanda hubung, dan spasi DI TENGAH; 3 sampai 30 karakter;
//  - spasi di awal dan akhir dibuang, spasi berurutan dipadatkan jadi satu (keyboard HP sering menambah spasi di ujung);
//  - huruf besar dan kecil DIBEDAKAN: "Budi" dan "budi" adalah dua username berbeda, baik saat login maupun saat dicek kembar.
const PANJANG_MIN = 3;
const PANJANG_MAKS = 30;
const BENTUK = /^[A-Za-z0-9._-]+(?: [A-Za-z0-9._-]+)*$/;
const PESAN_USERNAME = 'Username 3 sampai 30 karakter: huruf, angka, titik, garis bawah, tanda hubung, atau spasi di tengah';

function normalisasiUsername(nilai) {
  return typeof nilai === 'string' ? nilai.trim().replace(/\s+/g, ' ') : '';
}

function usernameValid(nilai) {
  return nilai.length >= PANJANG_MIN && nilai.length <= PANJANG_MAKS && BENTUK.test(nilai);
}

module.exports = { normalisasiUsername, usernameValid, PESAN_USERNAME };
