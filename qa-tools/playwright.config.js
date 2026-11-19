// Konfigurasi Playwright untuk uji browser SIMO.
// Memakai Chrome yang sudah terpasang (channel 'chrome'), jadi tidak mengunduh browser.
// Cara pakai: lihat bagian "Uji browser (Playwright)" di README.md.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  outputDir: './hasil/playwright',
  snapshotPathTemplate: '{testDir}/__tangkapan__/{testFilePath}/{projectName}-{arg}{ext}',
  // list = ringkasan di terminal; html = laporan web (buka dengan `npx playwright show-report hasil/laporan-html`).
  // blob = hasil mentah untuk laporan gabungan (`node jalankan-semua.js` -> hasil/laporan-gabungan).
  reporter: [
    ['list'],
    ['html', { outputFolder: './hasil/laporan-html', open: 'never' }],
    ['blob', { outputDir: './hasil/blob-e2e', fileName: 'e2e.zip' }],
  ],
  timeout: 30_000,
  workers: 1, // satu per satu: frontend/backend uji berbagi port dan database lokal
  use: {
    channel: 'chrome',
    baseURL: process.env.SIMO_FE_URL || 'http://localhost:3010',
    headless: true,
    // Animasi dimatikan agar perbandingan tangkapan layar stabil.
  },
  expect: {
    toHaveScreenshot: { animations: 'disabled', maxDiffPixels: 0 },
  },
  // Tangkapan tampilan (04) dijalankan dulu di kedua ukuran selagi database uji masih bersih. Tanpa ini, tampilan HP
  // ikut memotret data sisa uji alur desktop (05/06, namanya memuat cap waktu) sehingga acuannya berubah tiap run.
  // Nama project tampilan sengaja tetap 'desktop-1366'/'hp-390' agar nama berkas acuan di __tangkapan__ tidak berubah.
  projects: [
    { name: 'desktop-1366', testMatch: /04-tampilan/, use: { viewport: { width: 1366, height: 768 } } },
    { name: 'hp-390', testMatch: /04-tampilan/, use: { viewport: { width: 390, height: 844 } } },
    {
      name: 'desktop-1366 alur',
      testIgnore: /04-tampilan/,
      dependencies: ['desktop-1366', 'hp-390'],
      use: { viewport: { width: 1366, height: 768 } },
    },
    {
      name: 'hp-390 alur',
      testIgnore: /04-tampilan/,
      dependencies: ['desktop-1366 alur'],
      use: { viewport: { width: 390, height: 844 } },
    },
  ],
});
