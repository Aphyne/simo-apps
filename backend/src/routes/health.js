const express = require('express');
const rateLimit = require('express-rate-limit');
const pool = require('../db/pool');

const router = express.Router();

const BATAS_WAKTU_MS = 5000; // jangan menggantung lebih lama dari ini
const CACHE_MS = 5000; // hasil dipakai ulang beberapa detik agar tidak membebani database

// Publik (tanpa token) untuk dipantau layanan luar, jadi dibatasi laju per IP.
const dbLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak permintaan' },
});

let cache = null; // { waktu, hasil }
let berjalan = null; // pemeriksaan yang sedang jalan dipakai bersama, tidak ditumpuk

async function periksaDb() {
  const mulai = Date.now();
  let timer;
  const batas = new Promise((_, tolak) => {
    timer = setTimeout(() => tolak(new Error('timeout')), BATAS_WAKTU_MS);
  });
  try {
    await Promise.race([pool.query('SELECT 1'), batas]);
    return { ok: true, ms: Date.now() - mulai };
  } catch (err) {
    // Satu baris ringkas: tanpa stack, tanpa host/URL. Hanya kode atau jenis kesalahan.
    const ringkas = err && err.message === 'timeout' ? 'timeout' : (err && err.code) || 'error';
    console.error(`[health/db] ${new Date().toISOString()} database tidak sehat (${ringkas}) setelah ${Date.now() - mulai} ms`);
    return { ok: false, ms: Date.now() - mulai };
  } finally {
    clearTimeout(timer);
  }
}

router.get('/db', dbLimiter, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    if (!cache || Date.now() - cache.waktu > CACHE_MS) {
      if (!berjalan) {
        berjalan = periksaDb().finally(() => { berjalan = null; });
      }
      const hasil = await berjalan;
      cache = { waktu: Date.now(), hasil };
    }
    const { ok, ms } = cache.hasil;
    if (ok) {
      return res.json({ success: true, status: 'ok', waktu_respons_ms: ms });
    }
    return res.status(503).json({ success: false, status: 'error', message: 'Database tidak dapat dijangkau' });
  } catch {
    return res.status(503).json({ success: false, status: 'error', message: 'Database tidak dapat dijangkau' });
  }
});

module.exports = router;
