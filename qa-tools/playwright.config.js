// Konfigurasi Playwright untuk uji browser SIMO.
// Memakai Chrome yang sudah terpasang (channel 'chrome'), jadi tidak mengunduh browser.
// Cara pakai: lihat bagian "Uji browser (Playwright)" di README.md.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  outputDir: './hasil/playwright',
  snapshotPathTemplate: '{testDir}/__tangkapan__/{testFilePath}/{projectName}-{arg}{ext}',
  reporter: [['list']],
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
  projects: [
    { name: 'desktop-1366', use: { viewport: { width: 1366, height: 768 } } },
    { name: 'hp-390', use: { viewport: { width: 390, height: 844 } } },
  ],
});
