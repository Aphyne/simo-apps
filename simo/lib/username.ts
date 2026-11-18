// Aturan username login, sama dengan backend (backend/src/utils/username.js). Longgar tetapi aman (keputusan Boss,
// 18 Nov 2026): huruf besar dan kecil, angka, titik, garis bawah, tanda hubung, dan spasi di tengah; 3 sampai 30 karakter.
// Spasi di ujung dibuang dan spasi berurutan dipadatkan; huruf besar dan kecil DIBEDAKAN ("Budi" dan "budi" berbeda).
export const PESAN_USERNAME = 'Username 3 sampai 30 karakter: huruf, angka, titik, garis bawah, tanda hubung, atau spasi di tengah'

const BENTUK = /^[A-Za-z0-9._-]+(?: [A-Za-z0-9._-]+)*$/

export function normalisasiUsername(nilai: string): string {
  return nilai.trim().replace(/\s+/g, ' ')
}

export function usernameValid(nilai: string): boolean {
  const n = normalisasiUsername(nilai)
  return n.length >= 3 && n.length <= 30 && BENTUK.test(n)
}
