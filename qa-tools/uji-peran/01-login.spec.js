// Halaman Login (desain baru 18-19 Nov 2026): tampilan desktop dan HP, validasi, pesan gagal, tombol tampilkan password,
// tempel (paste) password, urutan Tab, pesan bergilir, gerak dikurangi, login per peran, cookie, dan keluar.
const { test, expect, BE, pasangProxy, tenang, db, meluap } = require('./_bantu');

test.describe('Login', () => {
  test('tampilan desktop: judul, label, tombol Masuk, panel pengantar, tanpa gulir horizontal', async ({ page }) => {
    await page.goto('/login');
    await tenang(page);
    await expect(page.getByRole('heading', { name: 'Selamat datang kembali' })).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Masuk', exact: true })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Pengantar SIMO' })).toBeVisible();
    await expect(page.getByText('Lupa password? Hubungi admin apotek')).toBeVisible();
    expect(await meluap(page)).toBe(false);
  });

  test('tampilan HP 390: panel pengantar disembunyikan, merek SIMO tampil, tanpa gulir horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/login');
    await tenang(page);
    await expect(page.getByRole('group', { name: 'Pengantar SIMO' })).toBeHidden();
    await expect(page.getByText('SIMO', { exact: true }).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Selamat datang kembali' })).toBeVisible();
    expect(await meluap(page)).toBe(false);
  });

  test('kolom username otomatis difokus; atribut autocomplete dan tanpa kapital otomatis', async ({ page }) => {
    await page.goto('/login');
    await tenang(page);
    await expect(page.getByLabel('Username')).toBeFocused();
    await expect(page.getByLabel('Username')).toHaveAttribute('autocomplete', 'username');
    await expect(page.getByLabel('Username')).toHaveAttribute('autocapitalize', 'none');
    await expect(page.locator('#password')).toHaveAttribute('autocomplete', 'current-password');
  });

  test('kirim kosong: galat di bawah tiap kolom, aria-invalid, tetap di /login', async ({ page }) => {
    await page.goto('/login');
    await tenang(page);
    await page.getByRole('button', { name: 'Masuk', exact: true }).click();
    await expect(page.locator('#username-error')).toHaveText('Username wajib diisi');
    await expect(page.locator('#password-error')).toHaveText('Password wajib diisi');
    await expect(page.getByLabel('Username')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#password')).toHaveAttribute('aria-invalid', 'true');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('password salah: pesan jujur (petunjuk huruf besar/kecil), tanpa muat ulang, tombol aktif lagi', async ({ page }) => {
    await page.goto('/login');
    await tenang(page);
    await page.evaluate(() => { window.__penanda = 'tidak-reload'; });
    await page.getByLabel('Username').fill('staf1');
    await page.locator('#password').fill('salah-sekali');
    await page.getByRole('button', { name: 'Masuk', exact: true }).click();
    const alert = page.getByRole('alert').filter({ hasText: 'Username atau password salah' });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('huruf besar dan kecil');
    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => window.__penanda)).toBe('tidak-reload');
    await expect(page.getByRole('button', { name: 'Masuk', exact: true })).toBeEnabled();
  });

  test('login gagal tadi tercatat di log aktivitas (untuk peneliti)', async () => {
    const rows = await db("SELECT COUNT(*)::int AS n FROM log_aktivitas WHERE jenis = 'login_gagal' AND username = 'staf1' AND created_at > NOW() - INTERVAL '10 minutes'");
    expect(rows[0].n).toBeGreaterThanOrEqual(1);
  });

  test('tombol tampilkan/sembunyikan password', async ({ page }) => {
    await page.goto('/login');
    await tenang(page);
    const pw = page.locator('#password');
    await pw.fill('rahasia123');
    await expect(pw).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Tampilkan password' }).click();
    await expect(pw).toHaveAttribute('type', 'text');
    await expect(page.getByRole('button', { name: 'Sembunyikan password' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Sembunyikan password' }).click();
    await expect(pw).toHaveAttribute('type', 'password');
  });

  test('tempel (paste) password tidak diblokir (WCAG 2.2 Accessible Authentication)', async ({ page }) => {
    await page.goto('/login');
    await tenang(page);
    const tidakDicegah = await page.evaluate(() => {
      const el = document.querySelector('#password');
      const ev = new ClipboardEvent('paste', { cancelable: true, bubbles: true, clipboardData: new DataTransfer() });
      return el.dispatchEvent(ev);
    });
    expect(tidakDicegah).toBe(true);
  });

  test('urutan Tab: username, password, tombol tampilkan, Masuk', async ({ page }) => {
    await page.goto('/login');
    await tenang(page);
    await expect(page.getByLabel('Username')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#password')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Tampilkan password' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Masuk', exact: true })).toBeFocused();
  });

  test('pesan bergilir: tiga titik, klik titik mengganti pesan, tombol jeda bekerja, dan berganti sendiri', async ({ page }) => {
    await page.goto('/login');
    await tenang(page);
    const titik = page.getByRole('button', { name: /^Tampilkan pesan \d dari 3$/ });
    await expect(titik).toHaveCount(3);
    await expect(titik.nth(0)).toHaveAttribute('aria-current', 'true');
    // berganti sendiri (tiap 6 detik) selama kursor tidak di atas panel
    await page.mouse.move(1300, 700);
    await expect(titik.nth(1)).toHaveAttribute('aria-current', 'true', { timeout: 9000 });
    await titik.nth(2).click();
    await expect(titik.nth(2)).toHaveAttribute('aria-current', 'true');
    const jeda = page.getByRole('button', { name: 'Hentikan pergantian pesan' });
    await jeda.click();
    await expect(page.getByRole('button', { name: 'Putar pergantian pesan' })).toBeVisible();
    await page.mouse.move(1300, 700);
    await page.waitForTimeout(7000);
    await expect(titik.nth(2)).toHaveAttribute('aria-current', 'true'); // tetap, karena dijeda
  });

  test('gerak dikurangi (prefers-reduced-motion): tanpa pergantian otomatis dan tanpa tombol jeda', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1366, height: 768 }, baseURL: process.env.SIMO_FE_URL || 'http://localhost:3000' });
    await pasangProxy(ctx);
    const page = await ctx.newPage();
    await page.goto('/login');
    await tenang(page);
    await expect(page.getByRole('button', { name: /pergantian pesan/ })).toHaveCount(0);
    const titik = page.getByRole('button', { name: /^Tampilkan pesan \d dari 3$/ });
    await page.waitForTimeout(7000);
    await expect(titik.nth(0)).toHaveAttribute('aria-current', 'true');
    await ctx.close();
  });

  test('Enter di kolom password mengirim form; staf masuk ke /dashboard; cookie Lax tanpa Secure', async ({ page, context }) => {
    await page.goto('/login');
    await tenang(page);
    await page.getByLabel('Username').fill('staf1');
    await page.locator('#password').fill('password');
    await page.locator('#password').press('Enter');
    await expect(page).toHaveURL(/\/dashboard$/);
    const cookie = (await context.cookies()).find((c) => c.name === 'simo_token');
    expect(cookie, 'cookie simo_token harus ada').toBeTruthy();
    expect(cookie.sameSite).toBe('Lax');
    expect(cookie.secure).toBe(false);
  });

  test('admin masuk ke /dashboard; peneliti masuk ke /pemantauan', async ({ browser }) => {
    for (const [user, tujuan] of [['admin', /\/dashboard$/], ['peneliti', /\/pemantauan$/]]) {
      const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, baseURL: process.env.SIMO_FE_URL || 'http://localhost:3000' });
      await pasangProxy(ctx);
      const page = await ctx.newPage();
      await page.goto('/login');
      await page.getByLabel('Username').fill(user);
      await page.locator('#password').fill('password');
      await page.getByRole('button', { name: 'Masuk', exact: true }).click();
      await expect(page).toHaveURL(tujuan);
      await ctx.close();
    }
  });

  test('sudah login lalu buka /login: diarahkan ke /dashboard; keluar mengembalikan ke /login dan mengunci halaman', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill('staf1');
    await page.locator('#password').fill('password');
    await page.getByRole('button', { name: 'Masuk', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard$/);
    await tenang(page);
    await page.getByRole('button', { name: 'Keluar', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('backend lokal yang dipakai uji: login peneliti tidak dicatat di log aktivitas', async ({ request }) => {
    const r = await request.post(`${BE}/api/auth/login`, { data: { username: 'peneliti', password: 'password' } });
    expect(r.ok()).toBe(true);
    const rows = await db("SELECT COUNT(*)::int AS n FROM log_aktivitas WHERE username = 'peneliti'");
    expect(rows[0].n).toBe(0);
  });
});
