// Uji menyeluruh per peran: halaman Login (desain baru), peran Staf, dan peran Peneliti (superadmin).
// Dijalankan lewat `node jalankan-uji-peran.js` dari folder qa-tools (lihat README.md, bagian "Uji per peran").
// Berbeda dengan e2e/: TIDAK membangun frontend. Uji memakai server dev yang sedang jalan di port 3000, dan semua
// panggilan API browser (http://localhost:8000/api) dialihkan ke backend uji lokal (Postgres sementara), jadi tidak
// menyentuh Neon dan tidak mengganggu .next server dev.
const path = require('path');
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: /\.spec\.js$/,
  outputDir: path.join(__dirname, '..', 'hasil', 'peran-playwright'),
  // list = ringkasan di terminal; html = laporan web (buka: npx playwright show-report hasil/laporan-peran-html).
  // blob = hasil mentah untuk laporan gabungan (`node jalankan-semua.js` -> hasil/laporan-gabungan).
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(__dirname, '..', 'hasil', 'laporan-peran-html'), open: 'never' }],
    ['blob', { outputDir: path.join(__dirname, '..', 'hasil', 'blob-peran'), fileName: 'peran.zip' }],
  ],
  // Label project agar uji ini mudah dibedakan dari desktop-1366/hp-390 di laporan gabungan.
  projects: [{ name: 'peran' }],
  // Server dev mengompilasi tiap halaman saat pertama dibuka, jadi batas waktunya longgar.
  timeout: 120_000,
  expect: { timeout: 20_000 },
  workers: 1,
  fullyParallel: false,
  use: {
    channel: process.env.SIMO_PW_CHANNEL || 'chrome',
    baseURL: process.env.SIMO_FE_URL || 'http://localhost:3000',
    headless: true,
    viewport: { width: 1366, height: 768 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    navigationTimeout: 90_000,
  },
});
