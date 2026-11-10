// Cookie token untuk middleware Next (hanya penanda login; API tetap memakai
// token dari sessionStorage). Dipusatkan di sini agar atribut seragam.
const NAMA = 'simo_token'
const MAX_AGE_DEFAULT = 7 * 24 * 60 * 60 // selaras JWT_EXPIRES_IN default backend (7d)

// Ambil sisa umur token dari klaim `exp` JWT supaya cookie selaras masa berlaku
// token; bila gagal dibaca pakai default 7 hari.
function maxAgeDariToken(token: string): number {
  try {
    const payload = token.split('.')[1]
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    if (typeof json.exp === 'number') {
      const sisa = Math.floor(json.exp - Date.now() / 1000)
      if (sisa > 0) return sisa
    }
  } catch {
    // abaikan, pakai default
  }
  return MAX_AGE_DEFAULT
}

export function setTokenCookie(token: string) {
  if (typeof document === 'undefined') return
  // Secure hanya saat HTTPS, supaya http://localhost tetap berfungsi.
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${NAMA}=${token}; path=/; max-age=${maxAgeDariToken(token)}; SameSite=Lax${secure}`
}

export function clearTokenCookie() {
  if (typeof document === 'undefined') return
  document.cookie = `${NAMA}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
}
