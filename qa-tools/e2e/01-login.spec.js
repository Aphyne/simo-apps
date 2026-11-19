// Login lewat tampilan: pesan error tidak hilang, cookie bertanda benar.
const { test, expect } = require('@playwright/test');

test.describe('login', () => {
  test('password salah: pesan error tampil dan halaman tidak dimuat ulang', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => { window.__penanda = 'tidak-reload'; });
    await page.getByLabel('Username').fill('admin');
    await page.locator('#password').fill('salah-sekali');
    await page.getByRole('button', { name: 'Masuk', exact: true }).click();
    await expect(page.getByText(/username atau password salah/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => window.__penanda)).toBe('tidak-reload');
  });

  test('login benar: masuk dashboard dan cookie sesuai (Lax, tanpa Secure di http, masa berlaku ~7 hari)', async ({ page, context }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill('admin');
    await page.locator('#password').fill('password');
    await page.getByRole('button', { name: 'Masuk', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    const cookie = (await context.cookies()).find((c) => c.name === 'simo_token');
    expect(cookie, 'cookie simo_token harus ada').toBeTruthy();
    expect(cookie.sameSite).toBe('Lax');
    expect(cookie.secure).toBe(false);
    const sisaHari = (cookie.expires - Date.now() / 1000) / 86400;
    expect(sisaHari).toBeGreaterThan(6);
    expect(sisaHari).toBeLessThan(8);
  });

  test('tanpa login: halaman dashboard diarahkan ke /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });
});
