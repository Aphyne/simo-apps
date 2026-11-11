// Uji pembuktian: Playwright + Chrome terpasang berjalan. Tidak butuh frontend/backend/database.
const { test, expect } = require('@playwright/test');

test('Playwright dapat membuka Chrome dan membaca halaman', async ({ page }) => {
  await page.setContent('<main><h1 id="judul">SIMO</h1><p>cek</p></main>');
  await expect(page.locator('#judul')).toHaveText('SIMO');
  const lebar = await page.evaluate(() => window.innerWidth);
  expect(lebar).toBeGreaterThan(300);
});
