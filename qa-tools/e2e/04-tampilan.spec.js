// Tampilan halaman utama (admin): tidak ada scroll horizontal, dan tangkapan layar tidak berubah.
// Tangkapan acuan ada di e2e/__tangkapan__/. Perbarui HANYA bila perubahan tampilan disengaja:
//   node jalankan-e2e.js -- --update-snapshots
const { test, expect } = require('@playwright/test');
const { masuk, tenang } = require('./_bantu');

const HALAMAN = [
  ['dashboard', '/dashboard'],
  ['obat', '/obat'],
  ['monitoring', '/monitoring'],
  ['barang-masuk', '/barang-masuk'],
  ['barang-keluar', '/barang-keluar'],
  ['laporan', '/laporan'],
  ['supplier', '/supplier'],
  ['users', '/users'],
  ['pengaturan', '/pengaturan'],
  ['reorder', '/reorder'],
];

test.beforeEach(async ({ page }) => {
  // Waktu dibekukan agar teks relatif ("X hari lagi", jam "Update:") tidak membuat tangkapan berubah-ubah.
  await page.clock.setFixedTime(new Date('2026-11-10T10:00:00+07:00'));
  await masuk(page, 'admin');
});

for (const [nama, rute] of HALAMAN) {
  test(`${nama}: tanpa scroll horizontal dan tampilan sama dengan acuan`, async ({ page }) => {
    await page.goto(rute);
    await tenang(page);
    const { sw, cw } = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    expect(sw, `scrollWidth ${sw} > clientWidth ${cw}`).toBeLessThanOrEqual(cw);
    await expect(page).toHaveScreenshot(`${nama}.png`, { fullPage: true });
  });
}

test('halaman tidak ada: tampil 404 yang rapi', async ({ page }) => {
  const r = await page.goto('/halaman-yang-tidak-ada');
  expect(r.status()).toBe(404);
  await expect(page.getByText(/tidak ditemukan/i).first()).toBeVisible();
});
