const { catat, userDariToken } = require('../services/aktivitasService');

// Mencatat aksi yang MENGUBAH data (POST/PUT/PATCH/DELETE) setelah request selesai
// dengan sukses. Hanya metode + endpoint + label — isi request tidak disimpan.

const MODUL = {
  'barang-masuk': 'barang masuk',
  'barang-keluar': 'barang keluar',
  obat: 'data obat',
  supplier: 'supplier',
  users: 'pengguna',
  pengaturan: 'pengaturan',
  simulasi: 'simulasi',
};

function labelAksi(method, path) {
  // /api/<modul>[/bulk|/:id[/aksi]]
  const bagian = path.replace(/^\/api\//, '').split('/').filter(Boolean);
  const modul = MODUL[bagian[0]];
  if (!modul) return null;
  const sub = bagian[1];
  const aksi = bagian[2] || (sub && !/^\d+$/.test(sub) ? sub : null);

  if (aksi === 'reset-password') return `Mereset password ${modul}`;
  if (aksi === 'toggle-aktif') return `Mengubah status aktif ${modul}`;
  if (aksi === 'hitung-ulang') return `Menghitung ulang EOQ/ROP ${modul}`;
  if (sub === 'bulk' && method === 'POST') return `Mencatat ${modul} (beberapa obat sekaligus)`;
  if (method === 'POST') return `Menambah ${modul}`;
  if (method === 'DELETE') return `Menghapus ${modul}`;
  return `Mengubah ${modul}`;
}

function aktivitasMiddleware(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();

  res.on('finish', () => {
    if (res.statusCode >= 400) return;
    const path = req.originalUrl.split('?')[0];
    const label = labelAksi(req.method, path);
    if (!label) return; // auth & aktivitas dicatat/dikecualikan di tempat lain
    const user = userDariToken(req);
    if (!user) return;
    catat({ req, user, jenis: 'aksi', deskripsi: label, path, status: res.statusCode });
  });
  next();
}

module.exports = aktivitasMiddleware;
