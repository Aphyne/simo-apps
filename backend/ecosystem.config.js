// Konfigurasi pm2 untuk menjalankan backend di server produksi:
//   npm install -g pm2
//   pm2 start ecosystem.config.js
//   pm2 save && pm2 startup     (agar menyala lagi setelah server restart)
// Cukup SATU instance: pencabutan token, cache akun, dan batas login disimpan di memori proses.
module.exports = {
  apps: [
    {
      name: 'simo-backend',
      script: 'src/app.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '400M',
      env: { NODE_ENV: 'production' },
    },
  ],
};
