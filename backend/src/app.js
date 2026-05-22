require('dotenv').config();
const express = require('express');
const cors = require('cors');

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

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SIMO API berjalan', env: process.env.NODE_ENV });
});

// Routes
app.use('/api/auth', authRoutes);
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
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`SIMO Backend berjalan di http://localhost:${PORT}`);
});
