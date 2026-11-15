// Hak akses di sisi tampilan (backend tetap yang menolak sebenarnya; ini mencegah form/halaman salah terbuka).
const { test, expect } = require('@playwright/test');
const { masuk, tenang } = require('./_bantu');

const KHUSUS_ADMIN = ['/users', '/pengaturan', '/obat/tambah', '/supplier', '/reorder'];

test.describe('staf', () => {
  test.beforeEach(async ({ page }) => { await masuk(page, 'staf1'); });

  for (const rute of KHUSUS_ADMIN) {
    test(`staf membuka langsung ${rute}: dialihkan ke /dashboard`, async ({ page }) => {
      await page.goto(rute);
      await expect(page).toHaveURL(/\/dashboard$/);
    });
  }

  test('staf tidak melihat tombol Tambah/Edit/Hapus obat', async ({ page }) => {
    await page.goto('/obat');
    await tenang(page);
    await expect(page.locator('main table tbody tr').first()).toBeVisible(); // data obat sudah termuat
    await expect(page.getByRole('link', { name: /tambah obat/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /^Ubah / })).toHaveCount(0); // ikon ubah memakai aria-label (bukan title)
  });
});

test.describe('admin', () => {
  test.beforeEach(async ({ page }) => { await masuk(page, 'admin'); });

  for (const rute of ['/users', '/pengaturan', '/obat/tambah', '/supplier', '/reorder']) {
    test(`admin dapat membuka ${rute}`, async ({ page }) => {
      await page.goto(rute);
      await tenang(page);
      await expect(page).toHaveURL(new RegExp(`${rute.replace('/', '\\/')}$`));
    });
  }

  test('admin melihat tombol Tambah Obat dan Edit', async ({ page }) => {
    await page.goto('/obat');
    await tenang(page);
    await expect(page.getByRole('link', { name: /tambah obat/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Ubah / }).first()).toBeVisible();
  });
});
