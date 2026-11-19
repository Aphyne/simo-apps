// Peran PENELITI (superadmin): menu, lonceng temuan (tanpa data obat), halaman Pemantauan (ubin, panel, periode, rincian
// pengguna, filter log), Analisis Komparatif (angka dari backend), dan hak akses API.
const { test, expect, BE, masukAPI, tenang, db, meluap } = require('./_bantu');

let sesi;

test.describe('Peneliti', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    sesi = await masukAPI(page, 'peneliti');
  });

  test('menu samping hanya Pemantauan dan Analisis Komparatif', async ({ page }) => {
    await page.goto('/pemantauan');
    await tenang(page);
    const nav = page.getByRole('navigation', { name: 'Navigasi utama' });
    await expect(nav.getByRole('link').first()).toBeVisible(); // menu tampil setelah sesi dipulihkan
    const menu = await nav.getByRole('link').allTextContents();
    expect(menu.map((m) => m.trim())).toEqual(['Pemantauan', 'Analisis Komparatif']);
  });

  test('lonceng peneliti: temuan login gagal beruntun dan akun diam; tidak memanggil data obat', async ({ page }) => {
    const dipanggil = [];
    page.on('request', (r) => { const u = r.url(); if (u.includes('localhost:8000/api/')) dipanggil.push(new URL(u).pathname); });
    await page.goto('/pemantauan');
    await tenang(page);
    const lonceng = page.getByRole('button', { name: /^Notifikasi/ });
    await expect(lonceng).toHaveAttribute('aria-label', /temuan pemantauan perlu dilihat/);
    await lonceng.click();
    const pop = page.getByRole('dialog', { name: 'Notifikasi pemantauan' });
    await expect(pop).toContainText('Login gagal beruntun');
    await expect(pop).toContainText('kasir_baru');
    await expect(pop).toContainText('Staf Dua belum muncul');
    await expect(pop.getByRole('link', { name: 'Buka Pemantauan' })).toBeVisible();
    expect(dipanggil.filter((p) => /\/api\/(obat|dashboard|barang-)/.test(p)), 'panggilan data obat').toEqual([]);
  });

  test('Pemantauan: lima ubin, semua panel, tanpa gulir horizontal; ubin Aksi data sama dengan database', async ({ page }) => {
    await page.goto('/pemantauan');
    await tenang(page);
    for (const t of ['Online sekarang', 'Hari aktif', 'Aksi data', 'Rata-rata sesi', 'Login gagal']) await expect(page.getByText(t, { exact: true }).first()).toBeVisible();
    for (const t of ['Aktivitas per hari', 'Perlu perhatian', 'Fitur yang dipakai', 'Kapan sistem dipakai', 'Jenis aksi data']) await expect(page.getByText(t, { exact: true }).first()).toBeVisible();
    for (const t of [/^Pengguna\s*\d*$/, /^Log aktivitas\s*\d*$/]) await expect(page.getByText(t).first()).toBeVisible();
    expect(await meluap(page)).toBe(false);
    const nDb = (await db(
      `SELECT COUNT(*)::int AS n FROM log_aktivitas WHERE jenis = 'aksi'
         AND (created_at AT TIME ZONE 'Asia/Jakarta')::date BETWEEN (NOW() AT TIME ZONE 'Asia/Jakarta')::date - 6 AND (NOW() AT TIME ZONE 'Asia/Jakarta')::date`))[0].n;
    const ringkasan = await page.getByRole('region', { name: 'Ringkasan' }).innerText();
    const m = ringkasan.match(/Aksi data\s+(\d+)/);
    expect(m, 'angka ubin Aksi data').toBeTruthy();
    expect(Number(m[1])).toBe(nDb);
  });

  test('periode: 30 hari mengubah URL; "Pilih tanggal sendiri" memunculkan kolom tanggal', async ({ page }) => {
    await page.goto('/pemantauan');
    await tenang(page);
    await page.getByRole('combobox', { name: 'Periode' }).click();
    await page.getByRole('option', { name: '30 hari terakhir', exact: true }).click();
    await expect(page).toHaveURL(/periode=30/);
    await page.getByRole('combobox', { name: 'Periode' }).click();
    await page.getByRole('option', { name: 'Pilih tanggal sendiri', exact: true }).click();
    await expect(page.getByLabel('Dari tanggal')).toBeVisible();
    await expect(page.getByLabel('Sampai tanggal')).toBeVisible();
  });

  test('rincian pengguna: dialog berisi grafik, fitur, aktivitas terakhir; "Lihat semua di log" memfilter log', async ({ page }) => {
    const admin = (await db("SELECT id, nama FROM users WHERE username = 'admin'"))[0];
    await page.goto('/pemantauan');
    await tenang(page);
    await page.getByRole('button', { name: admin.nama, exact: true }).first().click();
    const dialog = page.getByRole('dialog');
    for (const t of ['Aktivitas per hari', 'Fitur yang dipakai', 'Aktivitas terakhir']) await expect(dialog.getByRole('heading', { name: t })).toBeVisible();
    await dialog.getByRole('button', { name: 'Lihat semua di log aktivitas' }).click();
    await expect(page).toHaveURL(new RegExp(`user=${admin.id}`));
  });

  test('log aktivitas: filter jenis "Login gagal" hanya menampilkan login gagal', async ({ page }) => {
    await page.goto('/pemantauan');
    await tenang(page);
    await page.getByRole('combobox', { name: 'Jenis aktivitas' }).click();
    await page.getByRole('option', { name: 'Login gagal', exact: true }).click();
    await expect(page).toHaveURL(/jenis=login_gagal/);
    await tenang(page);
    const baris = page.locator('#log-aktivitas').locator('xpath=..').getByRole('row').filter({ hasText: /\d{2}\.\d{2}/ });
    const n = await baris.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) await expect(baris.nth(i)).toContainText('Login gagal');
  });

  test('Analisis Komparatif: ubin, grafik, tabel, rincian rumus, catatan metode; jumlah obat sama dengan database', async ({ page }) => {
    const nDb = (await db('SELECT COUNT(*)::int AS n FROM obat WHERE biaya_pesan > 0 AND biaya_simpan > 0 AND demand_tahunan > 0 AND satuan_per_dus > 0'))[0].n;
    await page.goto('/analisis');
    await tenang(page);
    await expect(page.getByRole('heading', { name: 'Analisis Komparatif' })).toBeVisible();
    const ringkasan = await page.getByRole('region', { name: 'Ringkasan perbandingan' }).innerText();
    expect(Number(ringkasan.match(/Obat dibandingkan\s+(\d+)/)[1])).toBe(nDb);
    for (const t of [/^Biaya per obat$/, /^Komposisi biaya$/, /^Rincian per obat\s*\d*$/, /^Cara menghitung dan batasannya$/]) await expect(page.getByText(t).first()).toBeVisible();
    await page.locator('table button').first().click();
    const dialog = page.getByRole('dialog');
    for (const t of ['Data masukan', 'Sebelum EOQ', 'Dengan EOQ', 'Penghematan per tahun']) await expect(dialog.getByText(t, { exact: true }).first()).toBeVisible();
    expect(await meluap(page)).toBe(false);
  });

  test('API: peneliti boleh membaca analitik dan analisis, tetapi tidak boleh menghapus stok (403)', async ({ request }) => {
    const h = { Authorization: `Bearer ${sesi.token}` };
    expect((await request.get(`${BE}/api/aktivitas/analitik`, { headers: h })).status()).toBe(200);
    expect((await request.get(`${BE}/api/analisis/perbandingan`, { headers: h })).status()).toBe(200);
    const bm = (await db('SELECT id FROM barang_masuk LIMIT 1'))[0];
    expect((await request.delete(`${BE}/api/barang-masuk/${bm.id}`, { headers: h })).status()).toBe(403);
  });

  test('aktivitas peneliti sendiri tidak tercatat di log', async () => {
    expect((await db("SELECT COUNT(*)::int AS n FROM log_aktivitas WHERE username = 'peneliti'"))[0].n).toBe(0);
  });

  test('HP 390: Pemantauan dan Analisis tanpa gulir horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const j of ['/pemantauan', '/analisis']) {
      await page.goto(j);
      await tenang(page);
      expect(await meluap(page), j).toBe(false);
    }
  });
});
