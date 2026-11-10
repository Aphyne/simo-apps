const { idValid, tanggalValid } = require('../utils/validasi');

// Parameter :id di path harus bilangan bulat positif. Tanpa ini, /obat/abc atau /obat/1e999
// sampai ke query database dan berujung 500 (temuan QA INJ-09).
function paramId(req, res, next, value) {
  if (!idValid(value)) {
    return res.status(400).json({ success: false, message: 'ID tidak valid' });
  }
  next();
}

const KUNCI_TANGGAL = ['dari', 'sampai', 'tanggal'];
const KUNCI_ID = ['obat_id', 'supplier_id'];

// Validasi query string untuk semua endpoint:
//  - nilai harus string (menolak ?search[x]=1 atau ?search=a&search=b yang jadi objek/array → TypeError 500)
//  - dari / sampai / tanggal harus tanggal YYYY-MM-DD yang valid (menolak "infinity", "abc")
//  - obat_id / supplier_id harus ID valid
function validasiQuery(req, res, next) {
  for (const [kunci, nilai] of Object.entries(req.query)) {
    if (typeof nilai !== 'string') {
      return res.status(400).json({ success: false, message: `Parameter "${kunci}" tidak valid` });
    }
    if (nilai === '') continue;
    if (KUNCI_TANGGAL.includes(kunci) && !tanggalValid(nilai)) {
      return res.status(400).json({ success: false, message: `Parameter "${kunci}" harus berformat YYYY-MM-DD` });
    }
    if (KUNCI_ID.includes(kunci) && !idValid(nilai)) {
      return res.status(400).json({ success: false, message: `Parameter "${kunci}" tidak valid` });
    }
  }
  next();
}

module.exports = { paramId, validasiQuery };
