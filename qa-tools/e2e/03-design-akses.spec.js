// /design: di produksi (next start) hanya superadmin ("peneliti"). Di mode pengembangan terbuka bebas
// (tidak diuji di sini karena stack uji memakai build produksi).
const { test, expect } = require('@playwright/test');
const { masuk, tenang } = require('./_bantu');

test.describe('/design di produksi', () => {
  test('tanpa login diarahkan ke /login', async ({ page }) => {
    await page.goto('/design');
    await expect(page).toHaveURL(/\/login$/);
  });

  for (const peran of ['staf1', 'admin']) {
    test(`${peran} tidak boleh: dialihkan ke /dashboard`, async ({ page }) => {
      await masuk(page, peran);
      await page.goto('/design');
      await expect(page).toHaveURL(/\/dashboard$/);
    });
  }

  test('peneliti (superadmin) boleh membuka /design', async ({ page }) => {
    await masuk(page, 'peneliti');
    await page.goto('/design');
    await tenang(page);
    await expect(page).toHaveURL(/\/design$/);
    await expect(page.getByRole('heading', { name: /design system/i }).first()).toBeVisible();
  });
});
