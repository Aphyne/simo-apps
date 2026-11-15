// Alur lengkap halaman Data Obat (daftar, tambah, detail, ubah) + API barunya, sebagai admin.
// Berjalan di dua ukuran layar (desktop dan HP). Tiap ukuran membuat obat ujinya sendiri (nama unik per
// waktu) dan menghapusnya di akhir, jadi tidak meninggalkan data. Hanya DB lokal sementara.
const { test, expect } = require('@playwright/test');
const { masuk, tenang, BE } = require('./_bantu');

const NAMA = `Uji Pw ${Date.now()}`; // dirapikan backend: huruf pertama tiap kata kapital
const rapi = (s) => s.replace(/\s+/g, ' ').trim();

async function pilih(page, id, opsi) {
  await page.locator(`#${id}`).click();
  await page.getByRole('option', { name: opsi, exact: true }).click();
}

async function isiObat(page, { nama, kategori = 'Vitamin', satuan = 'tablet', perDus = '100' }) {
  await page.locator('#nama').fill(nama);
  await pilih(page, 'kategori', kategori);
  await pilih(page, 'satuan', satuan);
  await page.locator('#satuan_per_dus').fill(perDus);
}

test.describe('Data Obat: alur admin', () => {
  test.describe.configure({ mode: 'serial' });
  let token;

  test.beforeEach(async ({ page }) => {
    const data = await masuk(page, 'admin');
    token = data.token;
  });

  const api = (page, path, opsi = {}) =>
    page.request.fetch(`${BE}/api${path}`, { headers: { Authorization: `Bearer ${token}` }, ...opsi });

  // ───────────────────────── Daftar ─────────────────────────
  test('daftar: kepala, ringkasan, dan tabel tampil', async ({ page }) => {
    await page.goto('/obat');
    await tenang(page);
    await expect(page.getByRole('heading', { name: 'Data obat' })).toBeVisible();
    await expect(page.getByText('Kondisi stok')).toBeVisible();
    await expect(page.getByText('Distribusi kategori')).toBeVisible();
    await expect(page.locator('main table tbody tr').first()).toBeVisible();
    // tanpa gulir horizontal pada halaman
    const meluap = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(meluap).toBe(false);
  });

  test('daftar: filter dan urutan tersimpan di alamat (URL)', async ({ page }) => {
    await page.goto('/obat?status=HARUS_REORDER&urut=stok&arah=desc');
    await tenang(page);
    await expect(page).toHaveURL(/status=HARUS_REORDER/);
    await expect(page.getByRole('button', { name: 'Atur ulang', exact: true })).toBeVisible();
    // alamat yang tidak dikenal diabaikan, tidak merusak halaman
    await page.goto('/obat?status=NGAWUR&urut=ngawur&hal=abc');
    await tenang(page);
    await expect(page.getByRole('heading', { name: 'Data obat' })).toBeVisible();
    await expect(page.locator('main table')).toBeVisible();
  });

  test('daftar: klik ikon pensil lalu Batal kembali ke daftar yang sama, bukan ke detail', async ({ page }) => {
    await page.goto('/obat?kategori=Vitamin');
    await tenang(page);
    const awal = new URL(page.url());
    await page.getByRole('link', { name: /^Ubah / }).first().click();
    await expect(page).toHaveURL(/\/obat\/\d+\/edit\?dari=/);
    await page.getByRole('button', { name: 'Batal' }).click();
    await expect(page).toHaveURL(awal.pathname + awal.search);
    await expect(page.url()).not.toContain('/detail');
  });

  test('daftar: dari ikon pensil, Kembali di kepala juga ke daftar', async ({ page }) => {
    await page.goto('/obat');
    await tenang(page);
    await page.getByRole('link', { name: /^Ubah / }).first().click();
    await expect(page).toHaveURL(/\/edit\?dari=/);
    await page.getByRole('button', { name: /^Kembali$/ }).click();
    await expect(page).toHaveURL(/\/obat$/);
  });

  test('detail: tombol Ubah data lalu Kembali dan Batal kembali ke detail', async ({ page }) => {
    await page.goto('/obat');
    await tenang(page);
    await page.locator('main table tbody tr a[href*="/detail"]').first().click();
    await expect(page).toHaveURL(/\/obat\/\d+\/detail/);
    const detail = new URL(page.url()).pathname;
    await page.getByRole('link', { name: 'Ubah data' }).click();
    await expect(page).toHaveURL(/\/edit\?dari=/);
    await page.getByRole('button', { name: /^Kembali$/ }).click();
    await expect(page).toHaveURL(detail);
    await page.getByRole('link', { name: 'Ubah data' }).click();
    await page.getByRole('button', { name: 'Batal' }).click();
    await expect(page).toHaveURL(detail);
  });

  test('ubah: dibuka langsung tanpa asal jatuh ke detail; asal luar diabaikan', async ({ page }) => {
    await page.goto('/obat');
    await tenang(page);
    const href = await page.getByRole('link', { name: /^Ubah / }).first().getAttribute('href');
    const id = href.match(/\/obat\/(\d+)\/edit/)[1];
    await page.goto(`/obat/${id}/edit`);
    await tenang(page);
    await page.getByRole('button', { name: 'Batal' }).click();
    await expect(page).toHaveURL(new RegExp(`/obat/${id}/detail$`));
    // alamat asal berbahaya tidak dipercaya
    await page.goto(`/obat/${id}/edit?dari=${encodeURIComponent('https://contoh.invalid/')}`);
    await tenang(page);
    await page.getByRole('button', { name: 'Batal' }).click();
    await expect(page).toHaveURL(new RegExp(`/obat/${id}/detail$`));
  });

  test('ubah: isian yang diubah meminta konfirmasi sebelum dibuang (Kembali dan Batal)', async ({ page }) => {
    await page.goto('/obat');
    await tenang(page);
    await page.getByRole('link', { name: /^Ubah / }).first().click();
    await tenang(page);
    await page.locator('#nama').fill('Nama Diubah Sementara');
    await page.getByRole('button', { name: /^Kembali$/ }).click();
    await expect(page.getByRole('alertdialog')).toContainText('Buang isian ini?');
    await page.getByRole('button', { name: 'Lanjut mengisi' }).click();
    await expect(page).toHaveURL(/\/edit\?dari=/);
    await page.getByRole('button', { name: 'Batal' }).click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByRole('button', { name: 'Buang isian' }).click();
    await expect(page).toHaveURL(/\/obat$/);
  });

  // ───────────────────────── Tambah ─────────────────────────
  test('tambah: kirim kosong menampilkan galat inline dan memfokuskan field pertama', async ({ page }) => {
    await page.goto('/obat/tambah');
    await tenang(page);
    await page.getByRole('button', { name: 'Tambah obat' }).click();
    await expect(page.getByText('Nama obat wajib diisi')).toBeVisible();
    await expect(page.getByText('Kategori wajib dipilih')).toBeVisible();
    await expect(page.getByText('Satuan wajib dipilih')).toBeVisible();
    expect(await page.evaluate(() => document.activeElement && document.activeElement.id)).toBe('nama');
    // hanya Nama terisi: fokus pindah ke Kategori (Select), bukan dilewati
    await page.locator('#nama').fill('Hanya Nama');
    await page.getByRole('button', { name: 'Tambah obat' }).click();
    expect(await page.evaluate(() => document.activeElement && document.activeElement.id)).toBe('kategori');
  });

  test('tambah: isi per dus divalidasi inline (bulat 1 sampai 100.000), tanpa balon bawaan peramban', async ({ page }) => {
    await page.goto('/obat/tambah');
    await tenang(page);
    await isiObat(page, { nama: 'Uji Validasi', perDus: '0' });
    await page.getByRole('button', { name: 'Tambah obat' }).click();
    await expect(page.getByText('Isi per dus minimal 1')).toBeVisible();
    await page.locator('#satuan_per_dus').fill('100001');
    await page.getByRole('button', { name: 'Tambah obat' }).click();
    await expect(page.getByText('Isi per dus maksimal 100.000')).toBeVisible();
    // kalimat hidup mengikuti isian
    await page.locator('#satuan_per_dus').fill('12');
    await expect(page.getByText('1 dus berisi')).toBeVisible();
    await expect(page.locator('#dus-satuan')).toHaveText('tablet');
    // karakter yang tidak masuk akal untuk bilangan bulat diblokir
    await page.locator('#satuan_per_dus').fill('');
    await page.locator('#satuan_per_dus').pressSequentially('1e5');
    expect(await page.locator('#satuan_per_dus').inputValue()).toBe('15');
  });

  test('tambah: Kembali dengan isian meminta konfirmasi; Batal tanpa isian langsung kembali', async ({ page }) => {
    await page.goto('/obat?kategori=Vitamin');
    await tenang(page);
    await page.getByRole('link', { name: /^Tambah obat$/ }).first().click();
    await expect(page).toHaveURL(/\/obat\/tambah\?dari=/);
    await page.locator('#nama').fill('Setengah Terisi');
    await page.getByRole('button', { name: /^Kembali$/ }).click();
    await expect(page.getByRole('alertdialog')).toContainText('Buang isian ini?');
    await page.getByRole('button', { name: 'Buang isian' }).click();
    await expect(page).toHaveURL(/\/obat\?kategori=Vitamin$/);
  });

  test('tambah: simpan lalu langsung terlihat di daftar', async ({ page }) => {
    await page.goto('/obat/tambah');
    await tenang(page);
    await isiObat(page, { nama: NAMA, kategori: 'Vitamin', satuan: 'tablet', perDus: '100' });
    await page.getByRole('button', { name: 'Tambah obat' }).click();
    await expect(page).toHaveURL(/\/obat\?q=/);
    await tenang(page);
    await expect(page.locator('main table tbody tr', { hasText: NAMA })).toBeVisible();
  });

  test('tambah: nama kembar ditolak (tanpa membedakan huruf), galat tampil di bawah field Nama', async ({ page }) => {
    await page.goto('/obat/tambah');
    await tenang(page);
    await isiObat(page, { nama: NAMA.toLowerCase() });
    await page.getByRole('button', { name: 'Tambah obat' }).click();
    await expect(page.locator('#nama-error')).toContainText('sudah ada');
    await expect(page).toHaveURL(/\/obat\/tambah/);
    expect(await page.evaluate(() => document.activeElement && document.activeElement.id)).toBe('nama');
  });

  test('tambah: simpan dan tambah lagi mengosongkan nama, kategori dan satuan tetap', async ({ page }) => {
    const nama2 = `${NAMA} B`;
    await page.goto('/obat/tambah');
    await tenang(page);
    await isiObat(page, { nama: nama2, kategori: 'Analgesik', satuan: 'botol', perDus: '24' });
    await page.getByRole('button', { name: 'Simpan dan tambah lagi' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'sudah ditambahkan' })).toContainText('Kategori dan satuan tetap');
    await expect(page.locator('#nama')).toHaveValue('');
    await expect(page.locator('#kategori')).toContainText('Analgesik');
    await expect(page.locator('#satuan')).toContainText('botol');
    await expect(page.locator('#satuan_per_dus')).toHaveValue('1');
    expect(await page.evaluate(() => document.activeElement && document.activeElement.id)).toBe('nama');
  });

  // ───────────────────────── Detail ─────────────────────────
  test('detail: obat baru (stok 0) tampil Habis, kalimat tindakan, dan Buka Reorder', async ({ page }) => {
    await page.goto(`/obat?q=${encodeURIComponent(NAMA)}`);
    await tenang(page);
    await page.locator('main table tbody tr', { hasText: NAMA }).first().locator('a[href*="/detail"]').first().click();
    await expect(page.getByRole('heading', { name: new RegExp(NAMA) })).toBeVisible();
    await expect(page.getByText('Habis', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Stok habis, segera pesan.')).toBeVisible();
    await expect(page.getByText('Belum diisi').first()).toBeVisible(); // harga belum ada (terisi dari Barang masuk)
    await expect(page.getByRole('link', { name: 'Buka Reorder' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ubah data' })).toBeVisible();
    // perhitungan: sebab hasil kosong ditulis satu kali, dan ROP tidak diulang di kolom hasil
    await expect(page.getByText('Belum bisa dihitung.')).toHaveCount(1);
    await expect(page.getByRole('button', { name: /cara menghitung/i })).toHaveCount(4); // tiga kolom hasil + tautan ROP
    await page.getByRole('button', { name: /cara menghitung titik pesan ulang/i }).click();
    await expect(page.getByRole('dialog')).toContainText('Reorder Point');
    await page.keyboard.press('Escape');
    const meluap = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(meluap).toBe(false);
    await page.getByRole('link', { name: 'Buka Reorder' }).click();
    await expect(page).toHaveURL(/\/reorder$/);
  });

  // ───────────────────────── Ubah ─────────────────────────
  test('ubah: ganti satuan memunculkan peringatan, konfirmasi, lalu kembali ke daftar', async ({ page }) => {
    await page.goto(`/obat?q=${encodeURIComponent(NAMA)}`);
    await tenang(page);
    await page.locator('main table tbody tr', { hasText: NAMA }).first().getByRole('link', { name: /^Ubah / }).click();
    await tenang(page);
    await expect(page.getByRole('heading', { name: /^Ubah / })).toBeVisible();
    await expect(page.getByText('Satuan berubah')).toHaveCount(0); // belum berubah: tidak ada peringatan
    await pilih(page, 'satuan', 'strip');
    await expect(page.getByText(/Satuan berubah dari tablet ke strip/)).toBeVisible();
    await page.getByRole('button', { name: 'Simpan perubahan' }).click();
    await expect(page.getByRole('alertdialog')).toContainText('Ubah satuan menjadi strip?');
    await page.getByRole('button', { name: 'Periksa lagi' }).click();
    await expect(page).toHaveURL(/\/edit\?dari=/); // tidak tersimpan, masih di halaman ubah
    await page.getByRole('button', { name: 'Simpan perubahan' }).click();
    await page.getByRole('button', { name: 'Ya, simpan' }).click();
    await expect(page).toHaveURL(/\/obat\?q=/); // kembali ke daftar asal beserta filternya
    await tenang(page);
    await expect(page.locator('main table tbody tr', { hasText: NAMA }).first()).toContainText('strip');
  });

  test('ubah: mengganti nama menjadi nama obat lain ditolak (kembar), nama sendiri tetap boleh', async ({ page }) => {
    const daftar = await (await api(page, '/obat?limit=5')).json();
    const lain = daftar.data.find((o) => !o.nama.startsWith('Uji Pw'));
    const sendiri = daftar.data.find((o) => o.nama.startsWith('Uji Pw')) ||
      (await (await api(page, `/obat?search=${encodeURIComponent(NAMA)}&limit=1`)).json()).data[0];
    expect(lain && sendiri).toBeTruthy();
    const tolak = await api(page, `/obat/${sendiri.id}`, { method: 'PUT', data: { nama: lain.nama.toLowerCase() } });
    expect(tolak.status()).toBe(409);
    expect((await tolak.json()).field).toBe('nama');
    const ok = await api(page, `/obat/${sendiri.id}`, { method: 'PUT', data: { nama: sendiri.nama } });
    expect(ok.status()).toBe(200);
  });

  // ───────────────────────── API baru ─────────────────────────
  test('API: urutan stok dan estimasi benar, nilai asing diabaikan', async ({ page }) => {
    const naik = (await (await api(page, '/obat?sort=stok&arah=asc&limit=100')).json()).data.map((o) => Number(o.stok));
    expect(naik).toEqual([...naik].sort((a, b) => a - b));
    const turun = (await (await api(page, '/obat?sort=stok&arah=desc&limit=100')).json()).data.map((o) => Number(o.stok));
    expect(turun).toEqual([...turun].sort((a, b) => b - a));

    const est = (await (await api(page, '/obat?sort=estimasi&arah=asc&limit=100')).json()).data.map((o) => o.estimasi_habis_hari);
    const adaNullDulu = est.findIndex((v) => v === null);
    if (adaNullDulu >= 0) expect(est.slice(adaNullDulu).every((v) => v === null)).toBe(true); // kosong selalu di akhir
    const berisi = est.filter((v) => v !== null);
    expect(berisi).toEqual([...berisi].sort((a, b) => a - b));

    const bawaan = (await (await api(page, '/obat?limit=100')).json()).data.map((o) => o.id);
    const asing = await api(page, '/obat?limit=100&sort=' + encodeURIComponent('nama; DROP TABLE obat--') + '&arah=desc;x');
    expect(asing.status()).toBe(200);
    expect((await asing.json()).data.map((o) => o.id)).toEqual(bawaan); // diabaikan: urutan bawaan nama A-Z
    expect((await api(page, '/obat?limit=1')).status()).toBe(200); // tabel obat masih utuh
  });

  test('API: filter expired akan dan lewat saling lepas; semua=true tanpa paginasi; limit dipotong 100', async ({ page }) => {
    const akan = (await (await api(page, '/obat?expired=akan&limit=100')).json()).data.map((o) => o.id);
    const lewat = (await (await api(page, '/obat?expired=lewat&limit=100')).json()).data.map((o) => o.id);
    expect(akan.filter((id) => lewat.includes(id))).toEqual([]);
    expect((await api(page, '/obat?expired=ngawur&limit=1')).status()).toBe(200);

    const besar = await (await api(page, '/obat?limit=9999')).json();
    expect(besar.data.length).toBeLessThanOrEqual(100); // pemotongan diam-diam yang didokumentasikan
    const semua = await (await api(page, '/obat?semua=true')).json();
    expect(semua.data.length).toBe(semua.meta.total);
    expect(semua.meta.last_page).toBe(1);
    for (const jalur of ['/barang-masuk', '/barang-keluar']) {
      const j = await (await api(page, `${jalur}?semua=true`)).json();
      expect(j.data.length).toBe(j.meta.total);
    }
  });

  // ───────────────────────── Hapus (sekaligus membersihkan data uji) ─────────────────────────
  test('daftar: hapus obat uji lewat dialog konfirmasi', async ({ page }) => {
    for (const nama of [`${NAMA} B`, NAMA]) {
      await page.goto(`/obat?q=${encodeURIComponent(nama)}`);
      await tenang(page);
      const baris = page.locator('main table tbody tr', { hasText: nama }).first();
      await expect(baris).toBeVisible();
      await baris.getByRole('button', { name: /^Hapus / }).click();
      await expect(page.getByRole('alertdialog')).toContainText('Hapus');
      await page.getByRole('alertdialog').getByRole('button', { name: 'Hapus', exact: true }).click();
      await expect(page.locator('main table tbody tr', { hasText: nama })).toHaveCount(0);
    }
  });
});

test.describe('Data Obat: staf', () => {
  test('staf tidak melihat ikon ubah/hapus, tombol tambah, ataupun Buka Reorder', async ({ page }) => {
    await masuk(page, 'staf1');
    await page.goto('/obat');
    await tenang(page);
    await expect(page.locator('main table tbody tr').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^Ubah / })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Hapus / })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /^Tambah obat$/ })).toHaveCount(0);
    await page.locator('main table tbody tr a[href*="/detail"]').first().click();
    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ubah data' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Buka Reorder' })).toHaveCount(0);
    await expect(page.getByText(/hanya bisa dilihat oleh admin/)).toBeVisible();
  });
});
