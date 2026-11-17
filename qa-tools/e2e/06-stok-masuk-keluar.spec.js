// Alur lengkap halaman Stok Masuk (/barang-masuk) dan Stok Keluar (/barang-keluar): ringkasan, filter di URL, form Catat
// (validasi, konfirmasi buang, banyak obat), tampilan Per faktur / Per transaksi, rincian, ubah, hapus, hak akses staf,
// dan perilaku layar (sidebar tetap saat dropdown terbuka, bilah Simpan menempel). Berjalan di dua ukuran layar.
// Tiap ukuran membuat supplier dan obat ujinya sendiri (nama unik). Hanya DB lokal sementara.
const { test, expect } = require('@playwright/test');
const { masuk, tenang, BE } = require('./_bantu');

const ymd = (tambahHari = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + tambahHari);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
// Rp dengan spasi biasa atau NBSP: formatRupiah memakai Intl id-ID
const rp = (angka) => new RegExp(`Rp\\s*${String(angka).replace(/\B(?=(\d{3})+(?!\d))/g, '\\.')}(?!\\d)`);

const data = {}; // keadaan per ukuran layar (supplier, obat, nomor faktur)

async function pilihSelect(page, id, opsi) {
  await page.locator(`#${id}`).click();
  await page.getByRole('option', { name: opsi, exact: true }).click();
}

async function pilihObat(page, idKolom, nama) {
  const kolom = page.locator(`#${idKolom}`);
  await kolom.click();
  await kolom.fill(nama);
  await page.getByRole('option', { name: new RegExp(nama.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).first().click();
}

test.describe('Stok Masuk dan Stok Keluar', () => {
  test.describe.configure({ mode: 'serial' });
  let token;
  let d;

  test.beforeEach(async ({ page }, info) => {
    const sesi = await masuk(page, 'admin');
    token = sesi.token;
    d = data[info.project.name] ??= {};
  });

  const api = (page, path, opsi = {}) =>
    page.request.fetch(`${BE}/api${path}`, { headers: { Authorization: `Bearer ${token}` }, ...opsi });
  const stokObat = async (page, id) => Number((await (await api(page, `/obat/${id}`)).json()).data.stok);

  // ───────────────────────── Persiapan ─────────────────────────
  test('persiapan: supplier dan dua obat uji lewat API', async ({ page }, info) => {
    const unik = `${info.project.name.replace(/\W/g, '')}${Date.now()}`;
    const sup = await (await api(page, '/supplier', {
      method: 'POST', data: { nama: `PBF Pw ${unik}`, alamat: 'Jl. Uji', telepon: '0800', lead_time_avg: 2, biaya_pesan: 1000 },
    })).json();
    d.supplier = sup.data.nama;
    for (const [kunci, nama, harga] of [['a', `Obat Pw A ${unik}`, 1500], ['b', `Obat Pw B ${unik}`, 2500]]) {
      const r = await (await api(page, '/obat', {
        method: 'POST',
        data: { nama, kategori: 'Vitamin', satuan: 'tablet', satuan_per_dus: 10, harga_beli: 1000, harga_jual: harga, stok: 0, biaya_pesan: 50000, biaya_simpan: 100, lead_time: 3, service_level: 95 },
      })).json();
      d[kunci] = { id: r.data.id, nama: r.data.nama, harga };
    }
    d.faktur = `PW-${unik}`;
    expect(d.a.id).toBeTruthy();
    expect(d.b.id).toBeTruthy();
  });

  // ───────────────────────── STOK MASUK ─────────────────────────
  test('masuk: halaman, kepala, tombol Catat, ubin, dan tanpa gulir horizontal', async ({ page }) => {
    await page.goto('/barang-masuk');
    await tenang(page);
    await expect(page.getByRole('heading', { name: 'Stok masuk' })).toBeVisible();
    // tombol Catat di kepala halaman (bukan di kepala panel riwayat)
    const tombol = page.getByRole('button', { name: 'Catat stok masuk' }).first();
    await expect(tombol).toBeVisible();
    for (const label of ['Total transaksi', 'Transaksi bulan ini', 'Satuan masuk bulan ini', 'Terakhir masuk']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(page.getByText('Riwayat stok masuk')).toBeVisible();
    const meluap = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(meluap).toBe(false);
  });

  test('masuk: form kosong menampilkan galat inline dan fokus ke kolom pertama yang salah', async ({ page }) => {
    await page.goto('/barang-masuk');
    await tenang(page);
    await page.getByRole('button', { name: 'Catat stok masuk' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Catat stok masuk' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Simpan stok masuk' }).click();
    await expect(page.locator('#supplier-error')).toHaveText('Pilih supplier');
    await expect(page.locator('#no_faktur-error')).toHaveText('No. faktur wajib diisi');
    await expect(page.locator('#item-0-obat-error')).toHaveText('Pilih obat');
    await expect(page.locator('#supplier')).toBeFocused();
    // tanpa isian, Batal menutup langsung (tanpa konfirmasi)
    await dialog.getByRole('button', { name: 'Batal' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('masuk: tutup dialog yang sudah diisi meminta konfirmasi buang', async ({ page }) => {
    await page.goto('/barang-masuk');
    await tenang(page);
    await page.getByRole('button', { name: 'Catat stok masuk' }).first().click();
    await page.locator('#no_faktur').fill('SEMENTARA-1');
    await page.getByRole('dialog').getByRole('button', { name: 'Batal' }).click();
    const konfirmasi = page.getByRole('alertdialog');
    await expect(konfirmasi).toContainText('Buang isian ini?');
    await konfirmasi.getByRole('button', { name: 'Lanjut mengisi' }).click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0); // tunggu animasi keluar selesai sebelum Esc berikutnya
    await expect(page.locator('#no_faktur')).toHaveValue('SEMENTARA-1');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('alertdialog')).toContainText('Buang isian ini?');
    await page.getByRole('alertdialog').getByRole('button', { name: 'Buang isian' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('masuk: peringatan expired non-memblokir untuk tanggal lewat dan kurang dari 3 bulan', async ({ page }) => {
    await page.goto('/barang-masuk');
    await tenang(page);
    await page.getByRole('button', { name: 'Catat stok masuk' }).first().click();
    await page.locator('#item-0-expired').fill(ymd(-5));
    await expect(page.locator('#item-0-expired-peringatan')).toContainText('Tanggal ini sudah lewat');
    await page.locator('#item-0-expired').fill(ymd(30));
    await expect(page.locator('#item-0-expired-peringatan')).toContainText('kurang dari 3 bulan lagi');
    await page.locator('#item-0-expired').fill(ymd(400));
    await expect(page.locator('#item-0-expired-peringatan')).toHaveCount(0);
  });

  test('masuk: catat satu faktur dua obat (PPN 11%, jatuh tempo) menambah stok', async ({ page }) => {
    await page.goto('/barang-masuk');
    await tenang(page);
    await page.getByRole('button', { name: 'Catat stok masuk' }).first().click();
    const dialog = page.getByRole('dialog');
    await pilihSelect(page, 'supplier', d.supplier);
    await page.locator('#no_faktur').fill(d.faktur);
    await page.locator('#jatuh_tempo').fill(ymd(30));
    await page.locator('#ppn_pct').fill('11');

    await pilihObat(page, 'item-0-obat', d.a.nama);
    await expect(dialog.getByText(/Stok sekarang 0 tablet/)).toBeVisible();
    await page.locator('#item-0-batch').fill('PWA1');
    await page.locator('#item-0-expired').fill(ymd(400));
    await page.locator('#item-0-dus').fill('2');
    await page.locator('#item-0-beli').fill('100000');
    await page.locator('#item-0-jual').fill(String(d.a.harga));
    await expect(dialog.getByText(/Harga beli riil/)).toBeVisible();

    await dialog.getByRole('button', { name: 'Tambah obat lain' }).click();
    await pilihObat(page, 'item-1-obat', d.b.nama);
    await page.locator('#item-1-batch').fill('PWB1');
    await page.locator('#item-1-expired').fill(ymd(400));
    await page.locator('#item-1-dus').fill('1');
    await page.locator('#item-1-beli').fill('50000');

    await dialog.getByRole('button', { name: 'Simpan stok masuk' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await stokObat(page, d.a.id)).toBe(20);
    expect(await stokObat(page, d.b.id)).toBe(10);
  });

  test('masuk: faktur dan obat yang sama ditolak server, pesan tetap di dalam dialog', async ({ page }) => {
    await page.goto('/barang-masuk');
    await tenang(page);
    await page.getByRole('button', { name: 'Catat stok masuk' }).first().click();
    const dialog = page.getByRole('dialog');
    await pilihSelect(page, 'supplier', d.supplier);
    await page.locator('#no_faktur').fill(d.faktur);
    await pilihObat(page, 'item-0-obat', d.a.nama);
    await page.locator('#item-0-batch').fill('PWA1');
    await page.locator('#item-0-expired').fill(ymd(400));
    await page.locator('#item-0-dus').fill('1');
    await dialog.getByRole('button', { name: 'Simpan stok masuk' }).click();
    await expect(dialog.getByText(/sudah tercatat/)).toBeVisible();
    await expect(dialog).toBeVisible();
    expect(await stokObat(page, d.a.id)).toBe(20); // stok tidak berubah
    await dialog.getByRole('button', { name: 'Batal' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Buang isian' }).click();
  });

  test('masuk: pencarian faktur tersimpan di alamat, tabel per obat, dan rincian baris', async ({ page }) => {
    await page.goto(`/barang-masuk?q=${encodeURIComponent(d.faktur)}`);
    await tenang(page);
    await expect(page.locator('main table:not(.sr-only) tbody tr')).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'Atur ulang', exact: true })).toBeVisible();
    await expect(page.getByText('Total 2 transaksi')).toBeVisible();
    await expect(page.getByText(/Pengeluaran sesudah PPN/)).toBeVisible();
    // rincian lewat nama obat
    await page.getByRole('button', { name: new RegExp(d.a.nama) }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: d.a.nama })).toBeVisible();
    await expect(dialog).toContainText('Jatuh tempo faktur');
    await expect(dialog).toContainText('Harga beli (PPN 11%)');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // Atur ulang mengosongkan pencarian dan alamat
    await page.getByRole('button', { name: 'Atur ulang', exact: true }).click();
    await expect(page).not.toHaveURL(/q=/);
  });

  test('masuk: tampilan Per faktur menampilkan satu baris, jatuh tempo, dan total rata kanan di rincian', async ({ page }) => {
    await page.goto(`/barang-masuk?q=${encodeURIComponent(d.faktur)}`);
    await tenang(page);
    await page.getByRole('radio', { name: 'Per faktur' }).click();
    await expect(page).toHaveURL(/tampil=faktur/);
    await expect(page.locator('main table:not(.sr-only) tbody tr')).toHaveCount(1);
    await expect(page.locator('main table:not(.sr-only) tbody tr').first()).toContainText(d.supplier);
    await expect(page.locator('main table:not(.sr-only) tbody tr').first()).toContainText('2');
    await page.getByRole('button', { name: d.supplier }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: d.supplier })).toBeVisible();
    await expect(dialog).toContainText(d.faktur);
    await expect(dialog).toContainText('Jatuh tempo');
    // total: 200.000 + 50.000 = 250.000 sebelum PPN; PPN 11% = 27.500; sesudah = 277.500
    await expect(dialog.locator('tfoot')).toContainText(rp(250000));
    await expect(dialog.locator('tfoot')).toContainText(rp(27500));
    await expect(dialog.locator('tfoot')).toContainText(rp(277500));
    // total berada di kolom paling kanan (sejajar kolom Subtotal)
    const kolomTerakhir = dialog.locator('thead th').last();
    const sel = dialog.locator('tfoot tr').last().locator('td').last();
    const [a, b] = [await kolomTerakhir.boundingBox(), await sel.boundingBox()];
    expect(Math.abs((a.x + a.width) - (b.x + b.width))).toBeLessThan(3);
    // tanpa pemeriksa total faktur
    await expect(dialog.getByText('Total di faktur kertas')).toHaveCount(0);
    await page.keyboard.press('Escape');
  });

  test('masuk: ubah baris (admin) memuat PPN dan harga sebelum PPN yang benar, jatuh tempo berlaku untuk semua baris', async ({ page }) => {
    await page.goto(`/barang-masuk?q=${encodeURIComponent(d.faktur)}`);
    await tenang(page);
    await page.getByRole('button', { name: `Ubah stok masuk ${d.a.nama}` }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Ubah stok masuk' })).toBeVisible();
    await expect(page.locator('#ppn_pct')).toHaveValue('11');
    await expect(page.locator('#harga_beli_dus')).toHaveValue('100000'); // sebelum PPN, bukan 111000
    await expect(page.locator('#biaya_simpan_pct')).toHaveValue('20');
    const baru = ymd(60);
    await page.locator('#jatuh_tempo').fill(baru);
    await page.locator('#jumlah_dus').fill('3');
    await dialog.getByRole('button', { name: 'Simpan perubahan' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await stokObat(page, d.a.id)).toBe(30);
    const daftar = await (await api(page, `/barang-masuk?semua=true&search=${encodeURIComponent(d.faktur)}`)).json();
    expect(daftar.data).toHaveLength(2);
    for (const baris of daftar.data) expect(String(baris.jatuh_tempo).slice(0, 10) === baru || new Date(baris.jatuh_tempo).getDate() === new Date(baru).getDate()).toBe(true);
    const barisA = daftar.data.find((x) => x.obat_id === d.a.id);
    expect(Number(barisA.ppn_pct)).toBe(11); // PPN tidak hilang setelah disimpan ulang
  });

  test('masuk: sidebar tetap di tempatnya saat dropdown Semua waktu terbuka (desktop)', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-1366', 'Sidebar tetap hanya di layar lebar; di HP berupa drawer');
    await page.goto('/barang-masuk');
    await tenang(page);
    await page.evaluate(() => window.scrollTo(0, 600));
    const sebelum = await page.locator('#sidebar-nav').evaluate((el) => el.getBoundingClientRect().top);
    await page.getByRole('combobox', { name: 'Filter periode' }).click();
    await expect(page.getByRole('option', { name: 'Hari ini' })).toBeVisible();
    const sesudah = await page.locator('#sidebar-nav').evaluate((el) => el.getBoundingClientRect().top);
    expect(sebelum).toBe(0);
    expect(sesudah).toBe(0);
    await page.keyboard.press('Escape');
  });

  test('masuk: bilah Simpan menempel di bawah dialog saat form panjang digulir', async ({ page }) => {
    await page.goto('/barang-masuk');
    await tenang(page);
    await page.getByRole('button', { name: 'Catat stok masuk' }).first().click();
    const dialog = page.getByRole('dialog');
    for (let i = 0; i < 3; i++) await dialog.getByRole('button', { name: 'Tambah obat lain' }).click();
    const simpan = dialog.getByRole('button', { name: 'Simpan stok masuk' });
    await dialog.evaluate((el) => { el.scrollTop = 0; });
    await expect(simpan).toBeInViewport();
    const kotak = await dialog.boundingBox();
    const tombol = await simpan.boundingBox();
    // tombol berada di bagian bawah dialog dan tidak tertimpa isian di bawahnya
    expect(tombol.y + tombol.height).toBeLessThanOrEqual(kotak.y + kotak.height + 1);
    expect(tombol.y).toBeGreaterThan(kotak.y + kotak.height * 0.5);
    await dialog.getByRole('button', { name: 'Batal' }).click();
  });

  test('masuk: hapus baris (admin) menarik stok kembali', async ({ page }) => {
    await page.goto(`/barang-masuk?q=${encodeURIComponent(d.faktur)}`);
    await tenang(page);
    await page.getByRole('button', { name: `Hapus stok masuk ${d.b.nama}` }).click();
    await expect(page.getByRole('alertdialog')).toContainText('Stok obat dikurangi');
    await page.getByRole('alertdialog').getByRole('button', { name: 'Hapus', exact: true }).click();
    await expect(page.locator('main table:not(.sr-only) tbody tr')).toHaveCount(1);
    expect(await stokObat(page, d.b.id)).toBe(0);
  });

  // ───────────────────────── STOK KELUAR ─────────────────────────
  test('keluar: persiapan stok lewat API (obat A 50, obat B 20)', async ({ page }) => {
    const suppliers = (await (await api(page, '/supplier?limit=100')).json()).data;
    const r = await api(page, '/barang-masuk/bulk', {
      method: 'POST',
      data: {
        tanggal: ymd(0), supplier_id: suppliers.find((x) => x.nama === d.supplier).id,
        no_faktur: `${d.faktur}-K`, ppn_pct: 0,
        items: [
          { obat_id: d.a.id, no_batch: 'KA1', expired_batch: ymd(500), jumlah_dus: 2, harga_beli_dus: 10000 },
          { obat_id: d.b.id, no_batch: 'KB1', expired_batch: ymd(500), jumlah_dus: 2, harga_beli_dus: 10000 },
        ],
      },
    });
    expect(r.status()).toBe(201);
    expect(await stokObat(page, d.a.id)).toBe(50);
    expect(await stokObat(page, d.b.id)).toBe(20);
  });

  test('keluar: halaman, kepala, tombol Catat di kepala, ubin, tanpa gulir horizontal', async ({ page }) => {
    await page.goto('/barang-keluar');
    await tenang(page);
    await expect(page.getByRole('heading', { name: 'Stok keluar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Catat stok keluar' }).first()).toBeVisible();
    for (const label of ['Transaksi hari ini', 'Transaksi bulan ini', 'Penjualan hari ini', 'Penjualan bulan ini']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(page.getByText('Riwayat stok keluar')).toBeVisible();
    const meluap = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(meluap).toBe(false);
  });

  test('keluar: dialog Catat: keterangan bawaan Penjualan, autofokus Obat, fokus pindah ke Jumlah', async ({ page }) => {
    await page.goto('/barang-keluar');
    await tenang(page);
    await page.getByRole('button', { name: 'Catat stok keluar' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Catat stok keluar' })).toBeVisible();
    await expect(page.locator('#keterangan')).toContainText('Penjualan');
    await expect(page.locator('#obat-keluar')).toBeFocused();
    await expect(page.locator('#tanggal')).toHaveValue(ymd(0));
    // tanpa isian apa pun, Batal menutup langsung (keterangan bawaan bukan isian)
    await dialog.getByRole('button', { name: 'Batal' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Catat stok keluar' }).first().click();
    await pilihObat(page, 'obat-keluar', d.a.nama);
    await expect(page.locator('#jumlah-keluar')).toBeFocused();
    await expect(page.getByRole('dialog').getByText(/Stok tersedia 50 tablet/)).toBeVisible();
    await expect(page.getByRole('dialog').getByText(/Harga jual/)).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Batal' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Buang isian' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('keluar: stok tidak cukup diblokir dengan petunjuk, daftar kosong ditolak, jumlah bukan bulat ditolak', async ({ page }) => {
    await page.goto('/barang-keluar');
    await tenang(page);
    await page.getByRole('button', { name: 'Catat stok keluar' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Simpan stok keluar' }).click();
    await expect(dialog.getByText('Tambahkan minimal satu obat ke daftar')).toBeVisible();
    await pilihObat(page, 'obat-keluar', d.a.nama);
    await page.locator('#jumlah-keluar').fill('999');
    await expect(dialog.getByText(/Stok tidak cukup, kurang 949 tablet/)).toBeVisible();
    await dialog.getByRole('button', { name: 'Masukkan ke daftar' }).click();
    await expect(dialog.getByText(/hubungi admin/)).toBeVisible();
    await page.locator('#jumlah-keluar').fill('2.5');
    await dialog.getByRole('button', { name: 'Masukkan ke daftar' }).click();
    await expect(dialog.getByText('Jumlah harus bilangan bulat lebih dari 0')).toBeVisible();
    await dialog.getByRole('button', { name: 'Batal' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Buang isian' }).click();
  });

  test('keluar: Enter di Jumlah menambah ke daftar, harga dan subtotal tampil, Simpan dan catat lagi', async ({ page }) => {
    await page.goto('/barang-keluar');
    await tenang(page);
    await page.getByRole('button', { name: 'Catat stok keluar' }).first().click();
    const dialog = page.getByRole('dialog');
    await pilihObat(page, 'obat-keluar', d.a.nama);
    await page.locator('#jumlah-keluar').fill('3');
    await expect(dialog.getByText(rp(3 * d.a.harga)).first()).toBeVisible(); // subtotal di baris isian
    await page.locator('#jumlah-keluar').press('Enter');
    await expect(dialog).toBeVisible(); // Enter tidak menyimpan form
    await expect(dialog.getByText('Daftar obat (1)')).toBeVisible();
    await expect(page.locator('#obat-keluar')).toBeFocused();
    await pilihObat(page, 'obat-keluar', d.b.nama);
    await page.locator('#jumlah-keluar').fill('4');
    await page.locator('#jumlah-keluar').press('Enter');
    await expect(dialog.getByText('Daftar obat (2)')).toBeVisible();
    // total penjualan: 3 x harga A + 4 x harga B
    await expect(dialog).toContainText(rp(3 * d.a.harga + 4 * d.b.harga));
    await dialog.getByRole('button', { name: 'Simpan dan catat lagi' }).click();
    await expect(dialog.getByText(/tersimpan dan stok sudah berkurang/)).toBeVisible();
    await expect(dialog.getByText('Daftar obat (0)')).toBeVisible();
    await expect(page.locator('#keterangan')).toContainText('Penjualan'); // dipertahankan
    expect(await stokObat(page, d.a.id)).toBe(47);
    expect(await stokObat(page, d.b.id)).toBe(16);
    await dialog.getByRole('button', { name: 'Batal' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('keluar: simpan biasa menutup dialog dan stok berkurang; Retur lewat API untuk uji filter', async ({ page }) => {
    await page.goto('/barang-keluar');
    await tenang(page);
    await page.getByRole('button', { name: 'Catat stok keluar' }).first().click();
    const dialog = page.getByRole('dialog');
    await pilihObat(page, 'obat-keluar', d.b.nama);
    await page.locator('#jumlah-keluar').fill('2');
    await dialog.getByRole('button', { name: 'Masukkan ke daftar' }).click();
    await dialog.getByRole('button', { name: 'Simpan stok keluar' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await stokObat(page, d.b.id)).toBe(14);
    const retur = await api(page, '/barang-keluar/bulk', { method: 'POST', data: { tanggal: ymd(0), keterangan: 'Retur', items: [{ obat_id: d.a.id, jumlah: 1 }] } });
    expect(retur.status()).toBe(201);
    expect(await stokObat(page, d.a.id)).toBe(46);
  });

  test('keluar: filter keterangan tersimpan di alamat; footer menyebut tidak ada penjualan untuk Retur', async ({ page }) => {
    await page.goto('/barang-keluar');
    await tenang(page);
    await page.getByRole('combobox', { name: 'Filter keterangan' }).click();
    await page.getByRole('option', { name: 'Retur', exact: true }).click();
    await expect(page).toHaveURL(/keterangan=Retur/);
    await expect(page.locator('main table:not(.sr-only) tbody tr')).toHaveCount(1);
    await expect(page.getByText('Tidak ada penjualan pada hasil ini.')).toBeVisible();
    await page.getByRole('button', { name: 'Atur ulang', exact: true }).click();
    await expect(page).not.toHaveURL(/keterangan=/);
    // nilai yang tidak dikenal di alamat diabaikan
    await page.goto('/barang-keluar?keterangan=NGAWUR&tampil=ngawur&hal=abc');
    await tenang(page);
    await expect(page.getByRole('heading', { name: 'Stok keluar' })).toBeVisible();
    await expect(page.locator('main table:not(.sr-only)')).toBeVisible();
  });

  test('keluar: tampilan Per transaksi mengelompokkan keranjang dan total rata kanan di rincian', async ({ page }) => {
    await page.goto('/barang-keluar?tampil=transaksi');
    await tenang(page);
    await expect(page.getByRole('radio', { name: 'Per transaksi' })).toBeChecked();
    // keranjang 2 obat (Simpan dan catat lagi tadi) ada sebagai satu baris
    const baris2 = page.locator('main table:not(.sr-only) tbody tr', { hasText: '2 obat' });
    await expect(baris2.first()).toBeVisible();
    await baris2.first().getByRole('button').first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('2 obat');
    await expect(dialog).toContainText(d.a.nama);
    await expect(dialog).toContainText(d.b.nama);
    await expect(dialog.locator('tfoot')).toContainText(rp(3 * d.a.harga + 4 * d.b.harga));
    const kolomTerakhir = dialog.locator('thead th').last();
    const sel = dialog.locator('tfoot td').last();
    const [a, b] = [await kolomTerakhir.boundingBox(), await sel.boundingBox()];
    expect(Math.abs((a.x + a.width) - (b.x + b.width))).toBeLessThan(3);
    await page.keyboard.press('Escape');
    // kembali ke Per obat
    await page.getByRole('radio', { name: 'Per obat' }).click();
    await expect(page).not.toHaveURL(/tampil=transaksi/);
  });

  test('keluar: ubah baris Retur (admin) menampilkan stok sesudah perubahan dan menyesuaikan stok', async ({ page }) => {
    await page.goto('/barang-keluar?keterangan=Retur');
    await tenang(page);
    await page.getByRole('button', { name: `Ubah stok keluar ${d.a.nama}` }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Ubah stok keluar' })).toBeVisible();
    await page.locator('#jumlah').fill('2');
    await expect(dialog.getByText(/Stok berubah dari 46 menjadi 45 tablet/)).toBeVisible();
    await page.locator('#jumlah').fill('999');
    await expect(dialog.getByText(/Ditolak: stok akan menjadi minus/)).toBeVisible();
    await page.locator('#jumlah').fill('2');
    await dialog.getByRole('button', { name: 'Simpan perubahan' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await stokObat(page, d.a.id)).toBe(45);
  });

  test('keluar: hapus baris (admin) menambah stok lagi', async ({ page }) => {
    await page.goto('/barang-keluar?keterangan=Retur');
    await tenang(page);
    await page.getByRole('button', { name: `Hapus stok keluar ${d.a.nama}` }).click();
    await expect(page.getByRole('alertdialog')).toContainText('Stok obat ditambah lagi');
    await page.getByRole('alertdialog').getByRole('button', { name: 'Hapus', exact: true }).click();
    await expect(page.locator('main table:not(.sr-only) tbody tr')).toHaveCount(0);
    expect(await stokObat(page, d.a.id)).toBe(47);
  });

  test('staf: tombol Catat ada, tetapi Ubah dan Hapus tidak ada di kedua halaman', async ({ browser }, info) => {
    const ctx = await browser.newContext({ baseURL: info.project.use.baseURL, viewport: info.project.use.viewport });
    const page = await ctx.newPage();
    await masuk(page, 'staf1');
    for (const [rute, tombol] of [['/barang-masuk', 'Catat stok masuk'], ['/barang-keluar', 'Catat stok keluar']]) {
      await page.goto(rute);
      await tenang(page);
      await expect(page.getByRole('button', { name: tombol }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /^(Ubah|Hapus) stok / })).toHaveCount(0);
    }
    await ctx.close();
  });

  test('dashboard: tombol Catat stok keluar membuka dialog yang sama', async ({ page }) => {
    await page.goto('/dashboard');
    await tenang(page);
    await page.getByRole('button', { name: 'Catat stok keluar' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Catat stok keluar' })).toBeVisible();
    await expect(page.locator('#keterangan')).toContainText('Penjualan');
    await dialog.getByRole('button', { name: 'Batal' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
