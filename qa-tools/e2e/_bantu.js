// Pembantu uji browser: login lewat API (cepat) lalu pasang sesi seperti aplikasi memasangnya.
const BE = process.env.SIMO_BE_URL || 'http://localhost:8032';

// Pasang sesi untuk `username` (password 'password', hanya di DB lokal uji).
async function masuk(page, username) {
  const r = await page.request.post(`${BE}/api/auth/login`, { data: { username, password: 'password' } });
  if (!r.ok()) throw new Error(`login ${username} gagal: ${r.status()}`);
  const { data } = await r.json();
  const url = new URL(process.env.SIMO_FE_URL || 'http://localhost:3010');
  await page.context().addCookies([{ name: 'simo_token', value: data.token, domain: url.hostname, path: '/' }]);
  await page.addInitScript(([t, u]) => {
    if (!localStorage.getItem('simo_token')) {
      localStorage.setItem('simo_token', t);
      localStorage.setItem('simo_user', u);
    }
  }, [data.token, JSON.stringify(data.user)]);
  return data;
}

// Tunggu halaman selesai memuat data dan animasi grafik berhenti.
async function tenang(page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready); // font web (Figtree) harus sudah terpasang sebelum tangkapan layar
  await page.waitForTimeout(900);
}

module.exports = { masuk, tenang, BE };
