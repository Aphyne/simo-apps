// /design (panduan desain SIMO): publik tanpa login sejak 24 Nov 2026 (keputusan Boss). Isinya statis.
// Diuji di build produksi: tidak boleh dialihkan ke /login, dan pengguna yang sudah login juga tetap bisa membukanya.
const { test, expect } = require('@playwright/test');
const { masuk, tenang } = require('./_bantu');

test.describe('/design di produksi', () => {
  test('tanpa login bisa dibuka', async ({ page }) => {
    await page.goto('/design');
    await tenang(page);
    await expect(page).toHaveURL(/\/design$/);
    await expect(page.getByRole('heading', { name: /design system/i }).first()).toBeVisible();
  });

  for (const peran of ['staf1', 'admin', 'peneliti']) {
    test(`${peran} yang sudah login tetap bisa membuka`, async ({ page }) => {
      await masuk(page, peran);
      await page.goto('/design');
      await tenang(page);
      await expect(page).toHaveURL(/\/design$/);
    });
  }
});
