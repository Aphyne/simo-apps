// Pembantu uji per peran. Inti: semua permintaan browser ke API asli (http://localhost:8000/api, alamat yang tertanam di
// server dev) dialihkan ke backend uji lokal, sehingga yang diuji adalah backend + database sungguhan (lokal sementara).
const base = require('@playwright/test');
const { Client } = require('pg');

const BE = process.env.SIMO_BE_URL || 'http://localhost:8038';
const DB = process.env.SIMO_DB || 'postgresql://qa:qa@localhost:54329/simo_qa';
const API_ASLI = /^http:\/\/localhost:8000\/api\//;

async function pasangProxy(context) {
  await context.route(API_ASLI, async (route) => {
    const req = route.request();
    const asal = req.headers().origin || 'http://localhost:3000';
    const cors = {
      'access-control-allow-origin': asal,
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'authorization, content-type',
      'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const u = new URL(req.url());
    const headers = {};
    for (const k of ['authorization', 'content-type', 'user-agent', 'accept']) if (req.headers()[k]) headers[k] = req.headers()[k];
    try {
      const r = await fetch(BE + u.pathname + u.search, {
        method: req.method(),
        headers,
        body: ['GET', 'HEAD'].includes(req.method()) ? undefined : req.postDataBuffer(),
      });
      const body = Buffer.from(await r.arrayBuffer());
      await route.fulfill({ status: r.status, headers: { ...cors, 'content-type': r.headers.get('content-type') || 'application/json' }, body });
    } catch {
      await route.abort();
    }
  });
}

// `context` bawaan Playwright diberi proxy otomatis, jadi tiap uji langsung memakai backend lokal.
const test = base.test.extend({
  context: async ({ context }, use) => {
    await pasangProxy(context);
    await use(context);
  },
});
const { expect } = base;

// Login lewat API backend lokal lalu pasang sesi seperti aplikasi (cookie + localStorage). Untuk uji yang bukan
// tentang halaman login, supaya cepat. Password semua akun uji lokal: 'password'.
async function masukAPI(page, username) {
  const r = await page.request.post(`${BE}/api/auth/login`, { data: { username, password: 'password' } });
  if (!r.ok()) throw new Error(`login ${username} gagal: ${r.status()}`);
  const { data } = await r.json();
  await page.context().addCookies([{ name: 'simo_token', value: data.token, domain: 'localhost', path: '/' }]);
  await page.addInitScript(([t, u]) => {
    if (!localStorage.getItem('simo_token')) {
      localStorage.setItem('simo_token', t);
      localStorage.setItem('simo_user', u);
    }
  }, [data.token, JSON.stringify(data.user)]);
  return data;
}

async function tenang(page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
}

async function db(sql, params = []) {
  const c = new Client(DB);
  await c.connect();
  try { return (await c.query(sql, params)).rows; } finally { await c.end(); }
}

const meluap = (page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
// Rp dengan spasi biasa atau NBSP (Intl id-ID)
const rp = (angka) => new RegExp(`Rp\\s*${String(angka).replace(/\B(?=(\d{3})+(?!\d))/g, '\\.')}(?!\\d)`);
const adaRupiah = (teks) => /Rp\s*\d/.test(teks);

async function pilihCombobox(page, id, opsi) {
  await page.locator(`#${id}`).click();
  await page.getByRole('option', { name: opsi, exact: true }).click();
}
async function pilihObat(page, idKolom, nama) {
  const kolom = page.locator(`#${idKolom}`);
  await kolom.click();
  await kolom.fill(nama);
  await page.getByRole('option', { name: new RegExp(nama.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).first().click();
}
const ymd = (tambahHari = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + tambahHari);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

module.exports = { test, expect, BE, pasangProxy, masukAPI, tenang, db, meluap, rp, adaRupiah, pilihCombobox, pilihObat, ymd };
