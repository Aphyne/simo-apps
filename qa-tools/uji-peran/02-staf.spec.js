// Peran STAF (keputusan Boss 19 Nov 2026, docs/design/halaman/staf.md): menu dan hak akses, Dashboard tanpa uang,
// lonceng, Data Obat, Stok Masuk (boleh mengisi harga tetapi tidak melihatnya), Stok Keluar (harga jual dan total per
// transaksi boleh), pembatalan catatan sendiri dalam 10 menit, Laporan, dan API yang harus menolak staf.
const { test, expect, BE, masukAPI, tenang, db, meluap, rp, adaRupiah, pilihCombobox, pilihObat, ymd } = require('./_bantu');

const OBAT = 'Paracetamol Uji 500mg';
let sesi;

test.describe('Staf', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    sesi = await masukAPI(page, 'staf1');
  });

  test('menu samping hanya Dashboard, Data Obat, Stok Masuk, Stok Keluar, Laporan', async ({ page }) => {
    await page.goto('/dashboard');
    await tenang(page);
    const nav = page.getByRole('navigation', { name: 'Navigasi utama' });
    await expect(nav.getByRole('link').first()).toBeVisible(); // menu tampil setelah sesi dipulihkan
    const menu = await nav.getByRole('link').allTextContents();
    expect(menu.map((m) => m.trim())).toEqual(['Dashboard', 'Data Obat', 'Stok Masuk', 'Stok Keluar', 'Laporan']);
  });

  for (const rute of ['/reorder', '/supplier', '/users', '/pengaturan', '/pemantauan', '/analisis']) {
    test(`membuka langsung ${rute}: dialihkan ke /dashboard`, async ({ page }) => {
      await page.goto(rute);
      await expect(page).toHaveURL(/\/dashboard$/, { timeout: 60_000 });
    });
  }

  test('Dashboard: tombol utama Catat stok keluar, tanpa Tambah obat, ubin "Perlu dilaporkan ke admin", tanpa Rupiah', async ({ page }) => {
    await page.goto('/dashboard');
    await tenang(page);
    const keluar = page.getByRole('button', { name: 'Catat stok keluar' }).first();
    const masuk = page.getByRole('button', { name: 'Catat stok masuk' }).first();
    await expect(keluar).toBeVisible();
    expect((await keluar.boundingBox()).x).toBeLessThan((await masuk.boundingBox()).x);
    await expect(page.getByRole('button', { name: 'Tambah obat' })).toHaveCount(0);
    await expect(page.getByText('Perlu dilaporkan ke admin')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Lihat obatnya' })).toHaveAttribute('href', '/obat?status=HARUS_REORDER');
    await expect(page.getByText('Obat hampir habis')).toHaveCount(0);
    expect(adaRupiah(await page.locator('main').innerText())).toBe(false);
  });

  test('lonceng: daftar obat tanpa baris supplier, tautan ke Data Obat yang terfilter', async ({ page }) => {
    await page.goto('/dashboard');
    await tenang(page);
    await page.getByRole('button', { name: /^Notifikasi/ }).click();
    const pop = page.getByRole('dialog', { name: 'Notifikasi stok' });
    await expect(pop).toContainText('Perlu dipesan ulang');
    await expect(pop).toContainText('Amoxicillin Uji 500mg');
    await expect(pop).toContainText('Pemesanan dilakukan oleh admin');
    await expect(pop.getByText('Supplier belum diatur')).toHaveCount(0);
    await expect(pop.getByText('PBF Uji Peran')).toHaveCount(0);
    await pop.getByRole('link', { name: /Data Obat/ }).click();
    await expect(page).toHaveURL(/\/obat\?status=HARUS_REORDER/);
  });

  test('Data Obat: tanpa donat kategori, kolom Harga jual tampil, tanpa Tambah obat; detail tanpa Harga beli', async ({ page }) => {
    await page.goto('/obat');
    await tenang(page);
    await expect(page.getByText('Distribusi kategori')).toHaveCount(0);
    await expect(page.getByText('Kondisi stok')).toBeVisible();
    await expect(page.getByText('Perlu dilaporkan ke admin')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Harga jual' })).toBeVisible();
    await page.getByPlaceholder('Cari nama atau kode obat').fill('Uji');
    await tenang(page);
    const baris = page.getByRole('row').filter({ hasText: OBAT });
    await expect(baris).toContainText(rp(800));
    await expect(page.getByRole('link', { name: /^Tambah obat$/ })).toHaveCount(0);
    await page.getByRole('link', { name: OBAT }).first().click();
    await tenang(page);
    await expect(page.getByText('Harga jual per tablet')).toBeVisible();
    await expect(page.getByText('Harga beli per tablet')).toHaveCount(0);
    await expect(page.getByText(/hanya bisa dilihat oleh admin/)).toBeVisible();
  });

  test('API data obat untuk staf: harga jual ada, harga beli dan biaya tidak dikirim', async ({ request }) => {
    const r = await request.get(`${BE}/api/obat?limit=50`, { headers: { Authorization: `Bearer ${sesi.token}` } });
    const teks = await r.text();
    expect(r.status()).toBe(200);
    expect(teks).toContain('"harga_jual"');
    for (const k of ['harga_beli', 'biaya_pesan', 'biaya_simpan', 'total_biaya']) expect(teks).not.toContain(`"${k}"`);
  });

  test('Stok Masuk: tanpa grafik dan tanpa Rupiah; form memuat isian harga tanpa ringkasan harga/margin', async ({ page }) => {
    await page.goto('/barang-masuk');
    await tenang(page);
    for (const judul of ['Tren stok masuk', 'Masuk per obat', 'Pembelian bulan ini']) await expect(page.getByText(judul, { exact: true })).toHaveCount(0);
    expect(adaRupiah(await page.locator('main').innerText())).toBe(false);
    await page.getByRole('button', { name: 'Catat stok masuk' }).first().click();
    const dialog = page.getByRole('dialog');
    for (const id of ['#ppn_pct', '#item-0-beli', '#item-0-jual', '#item-0-simpan']) await expect(dialog.locator(id)).toBeVisible();
    await pilihObat(page, 'item-0-obat', OBAT);
    await page.locator('#item-0-beli').fill('10000');
    await expect(dialog.getByText(/Harga beli riil/)).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Batal' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Buang isian' }).click();
  });

  test('Stok Masuk: staf mencatat faktur berharga; harga tersimpan tetapi tidak tampil; lalu membatalkan dalam 10 menit', async ({ page }) => {
    const idObat = (await db('SELECT id, stok FROM obat WHERE nama = $1', [OBAT]))[0];
    await page.goto('/barang-masuk');
    await tenang(page);
    await page.getByRole('button', { name: 'Catat stok masuk' }).first().click();
    const dialog = page.getByRole('dialog');
    await pilihCombobox(page, 'supplier', 'PBF Uji Peran');
    await page.locator('#no_faktur').fill('F-STAF-UI-1');
    await page.locator('#ppn_pct').fill('11');
    await pilihObat(page, 'item-0-obat', OBAT);
    await page.locator('#item-0-batch').fill('BSTAF1');
    await page.locator('#item-0-expired').fill(ymd(400));
    await page.locator('#item-0-dus').fill('1');
    await page.locator('#item-0-beli').fill('10000');
    await dialog.getByRole('button', { name: 'Simpan stok masuk' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    const baru = (await db("SELECT bm.id, bm.harga_beli, bm.ppn_pct, bm.user_id FROM barang_masuk bm WHERE bm.no_faktur = 'F-STAF-UI-1'"))[0];
    expect(baru, 'catatan stok masuk staf tersimpan').toBeTruthy();
    expect(baru.user_id).toBe(sesi.user.id);
    expect(Math.abs(Number(baru.harga_beli) - 1110)).toBeLessThan(0.01); // 10.000 x 1,11 / 10 per dus
    expect((await db('SELECT stok FROM obat WHERE id = $1', [idObat.id]))[0].stok).toBe(idObat.stok + 10);

    await tenang(page);
    expect(adaRupiah(await page.locator('main').innerText())).toBe(false);
    const batalkan = page.getByRole('button', { name: `Batalkan stok masuk ${OBAT}` });
    await expect(batalkan).toHaveCount(1); // catatan admin di obat yang sama tidak punya tombol ini
    await batalkan.click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Batalkan catatan' }).click();
    await expect(page.getByRole('button', { name: `Batalkan stok masuk ${OBAT}` })).toHaveCount(0);
    expect((await db("SELECT COUNT(*)::int AS n FROM barang_masuk WHERE no_faktur = 'F-STAF-UI-1'"))[0].n).toBe(0);
    expect((await db('SELECT stok FROM obat WHERE id = $1', [idObat.id]))[0].stok).toBe(idObat.stok);
  });

  test('pembatalan dijaga backend: catatan admin ditolak (403), catatan lewat 10 menit ditolak (403)', async ({ request }) => {
    const h = { Authorization: `Bearer ${sesi.token}` };
    const admin = (await db("SELECT id FROM barang_masuk WHERE no_faktur = 'F-ADMIN-UJI'"))[0];
    let r = await request.delete(`${BE}/api/barang-masuk/${admin.id}`, { headers: h });
    expect(r.status()).toBe(403);
    expect((await r.json()).message).toContain('dibuatnya sendiri');
    // catatan staf yang dibuat 11 menit lalu
    const o = (await db('SELECT id, stok FROM obat WHERE nama = $1', [OBAT]))[0];
    const lama = (await db(
      `INSERT INTO barang_keluar (tanggal, obat_id, jumlah, keterangan, user_id, stok_sebelum, stok_sesudah, harga_jual, created_at)
       VALUES (CURRENT_DATE, $1, 1, 'Penjualan', $2, $3, $3, 800, NOW() - INTERVAL '11 minutes') RETURNING id`, [o.id, sesi.user.id, o.stok]))[0];
    r = await request.delete(`${BE}/api/barang-keluar/${lama.id}`, { headers: h });
    expect(r.status()).toBe(403);
    expect((await r.json()).message).toContain('10 menit');
    await db('DELETE FROM barang_keluar WHERE id = $1', [lama.id]);
  });

  test('Stok Keluar: staf mencatat penjualan, melihat harga jual dan total per transaksi, tanpa ubin Rupiah, lalu membatalkan', async ({ page }) => {
    const awal = (await db('SELECT id, stok FROM obat WHERE nama = $1', [OBAT]))[0];
    await page.goto('/barang-keluar');
    await tenang(page);
    for (const judul of ['Tren stok keluar', 'Keluar per obat']) await expect(page.getByText(judul, { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Catat stok keluar' }).first().click();
    const dialog = page.getByRole('dialog');
    await pilihObat(page, 'obat-keluar', OBAT);
    await page.locator('#jumlah-keluar').fill('3');
    await expect(dialog.getByText(rp(2400)).first()).toBeVisible(); // subtotal 3 x 800 boleh dilihat staf
    await dialog.getByRole('button', { name: 'Masukkan ke daftar' }).click();
    await dialog.getByRole('button', { name: 'Simpan stok keluar' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect((await db('SELECT stok FROM obat WHERE id = $1', [awal.id]))[0].stok).toBe(awal.stok - 3);

    await tenang(page);
    // ubin: jumlah transaksi, bukan Rupiah
    const ubin = page.getByText('Penjualan hari ini', { exact: true }).locator('xpath=ancestor::*[contains(@class,"rounded-2xl")][1]');
    expect(adaRupiah(await ubin.innerText())).toBe(false);
    const baris = page.getByRole('row').filter({ hasText: OBAT }).filter({ hasText: '3' }).first();
    await expect(baris).toContainText(/Rp\s*2\.400/); // total per transaksi (sel berikutnya menempel di teks baris)
    await expect(baris).toContainText(/oleh/);
    await page.getByRole('button', { name: `Batalkan stok keluar ${OBAT}` }).first().click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Batalkan catatan' }).click();
    await expect.poll(async () => (await db('SELECT stok FROM obat WHERE id = $1', [awal.id]))[0].stok).toBe(awal.stok);
  });

  test('Stok Keluar: catatan lama tanpa pencatat tertulis "Tidak tercatat" di rincian', async ({ page }) => {
    await page.goto('/barang-keluar');
    await tenang(page);
    await page.getByRole('row').filter({ hasText: 'Rusak' }).filter({ hasText: OBAT }).first().getByRole('button', { name: new RegExp(`^${OBAT}`) }).click(); // nama tombol = nama + kode obat
    await expect(page.getByRole('dialog')).toContainText('Tidak tercatat');
  });

  test('Laporan: urutan tab staf (Kartu stok bawaan), tanpa uang di Stok obat, Stok masuk, Stok keluar', async ({ page }) => {
    await page.goto('/laporan');
    await tenang(page);
    const tab = (await page.getByRole('tab').allTextContents()).map((t) => t.trim());
    expect(tab).toEqual(['Kartu stok', 'Kedaluarsa', 'Stok obat', 'Stok masuk', 'Stok keluar']);
    await expect(page.getByRole('tab', { name: 'Kartu stok' })).toHaveAttribute('data-state', 'active');
    for (const t of ['Stok obat', 'Stok masuk', 'Stok keluar']) {
      await page.getByRole('tab', { name: t }).click();
      await tenang(page);
      expect(adaRupiah(await page.locator('main').innerText()), `tab ${t} tanpa Rupiah`).toBe(false);
    }
    await expect(page.getByRole('columnheader', { name: 'Subtotal' })).toHaveCount(0);
  });

  test('API menolak staf untuk endpoint admin dan peneliti (403); laporan tanpa uang', async ({ request }) => {
    const h = { Authorization: `Bearer ${sesi.token}` };
    for (const [m, j] of [['get', '/api/users'], ['get', '/api/supplier'], ['get', '/api/laporan/eoq-rop'], ['get', '/api/aktivitas/analitik'], ['get', '/api/analisis/perbandingan'], ['get', '/api/dashboard/pembelian-penjualan'], ['put', '/api/pengaturan'], ['post', '/api/obat']]) {
      const r = await request[m](`${BE}${j}`, { headers: h, data: m === 'get' ? undefined : {} });
      expect(r.status(), `${m.toUpperCase()} ${j}`).toBe(403);
    }
    for (const j of ['/api/laporan/barang-masuk', '/api/laporan/barang-keluar', '/api/laporan/stok']) {
      const teks = await (await request.get(`${BE}${j}`, { headers: h })).text();
      for (const k of ['harga_beli', 'harga_jual', 'biaya_pesan', 'biaya_simpan', 'total_biaya']) expect(teks, `${j} tanpa ${k}`).not.toContain(`"${k}"`);
    }
  });

  test('HP 390: Dashboard, Data Obat, Stok Masuk, Stok Keluar, Laporan tanpa gulir horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const j of ['/dashboard', '/obat', '/barang-masuk', '/barang-keluar', '/laporan']) {
      await page.goto(j);
      await tenang(page);
      expect(await meluap(page), j).toBe(false);
    }
  });
});
