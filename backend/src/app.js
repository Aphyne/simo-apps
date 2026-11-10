require('dotenv').config();
require('./config/cekProduksi').terapkan();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const supplierRoutes = require('./routes/supplier');
const obatRoutes = require('./routes/obat');
const barangMasukRoutes = require('./routes/barangMasuk');
const barangKeluarRoutes = require('./routes/barangKeluar');
const dashboardRoutes = require('./routes/dashboard');
const monitoringRoutes = require('./routes/monitoring');
const analisisRoutes = require('./routes/analisis');
const laporanRoutes = require('./routes/laporan');
const simulasiRoutes = require('./routes/simulasi');
const userRoutes = require('./routes/users');
const pengaturanRoutes = require('./routes/pengaturan');
const aktivitasRoutes = require('./routes/aktivitas');
const aktivitasMiddleware = require('./middleware/aktivitasMiddleware');
const { validasiQuery } = require('./middleware/validasiInput');

const app = express();

// Di belakang reverse proxy / hosting, IP klien ada di header X-Forwarded-For. Tanpa ini semua
// pengguna terlihat berasal dari satu IP dan pembatas login mengunci semua orang sekaligus.
// Isi TRUST_PROXY dengan jumlah proxy di depan server (biasanya 1). Kosong = tidak percaya proxy.
if (process.env.TRUST_PROXY) {
  const tp = process.env.TRUST_PROXY;
  app.set('trust proxy', /^\d+$/.test(tp) ? Number(tp) : tp);
}

// Header keamanan standar (juga menyembunyikan X-Powered-By)
app.use(helmet());

// Batasi percobaan login gagal: 10 kali / 15 menit per IP. Login sukses tidak dihitung.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
});
app.use('/api/auth/login', loginLimiter);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(validasiQuery);
// Mencatat aksi yang mengubah data (untuk pemantauan peneliti) — lihat aktivitasMiddleware
app.use(aktivitasMiddleware);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SIMO API berjalan' });
});

// Health check database (publik, dibatasi laju, di-cache beberapa detik)
app.use('/api/health', require('./routes/health'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/aktivitas', aktivitasRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/obat', obatRoutes);
app.use('/api/barang-masuk', barangMasukRoutes);
app.use('/api/barang-keluar', barangKeluarRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/analisis', analisisRoutes);
app.use('/api/laporan', laporanRoutes);
app.use('/api/simulasi', simulasiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pengaturan', pengaturanRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// Error handler
app.use((err, req, res, next) => {
  // Kesalahan klien dari body-parser (JSON rusak = 400, body terlalu besar = 413), bukan error server
  if (err.status >= 400 && err.status < 500 && err.type) {
    return res.status(err.status).json({
      success: false,
      message: err.status === 413 ? 'Data terlalu besar' : 'Format data tidak valid',
    });
  }
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Jaring pengaman: error tak tertangani tidak boleh mematikan server diam-diam.
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err);
  process.exit(1); // keadaan tidak pasti: keluar, biarkan process manager (pm2/nodemon) menyalakan ulang
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`SIMO Backend berjalan di http://localhost:${PORT}`);
});
