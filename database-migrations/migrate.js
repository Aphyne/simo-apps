import pg from 'pg'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env dari folder database-migrations/
config({ path: join(__dirname, '.env') })

// ─── Validasi env ─────────────────────────────────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.error('\n❌  DATABASE_URL belum diisi di .env')
  console.error('   Salin .env.example ke .env lalu isi connection string dari Neon.\n')
  process.exit(1)
}

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // wajib untuk Neon
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Ambil semua file .sql di folder ini, diurutkan secara alfanumerik */
function getAllSqlFiles() {
  return readdirSync(__dirname)
    .filter((f) => /^\d{3}_.*\.sql$/.test(f))
    .sort()
}

/** File migrasi: 001_create_*.sql s.d. 007_create_*.sql (bukan seed) */
function getMigrationFiles() {
  return getAllSqlFiles().filter((f) => !f.includes('_seed_'))
}

/** File seed: semua yang mengandung "_seed_" */
function getSeedFiles() {
  return getAllSqlFiles().filter((f) => f.includes('_seed_'))
}

/** Buat tabel tracker jika belum ada */
async function ensureTracker(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id          SERIAL PRIMARY KEY,
      filename    VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)
}

/** Daftar file yang sudah pernah dijalankan */
async function getExecuted(client) {
  const res = await client.query(
    'SELECT filename FROM _migrations ORDER BY filename'
  )
  return res.rows.map((r) => r.filename)
}

/** Jalankan satu file SQL */
async function runFile(client, filename) {
  const sql = readFileSync(join(__dirname, filename), 'utf8')
  process.stdout.write(`  → ${filename} ... `)
  await client.query(sql)
  await client.query(
    'INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
    [filename]
  )
  console.log('✓')
}

/** Drop semua tabel utama + tracker */
async function dropAll(client) {
  await client.query(`
    DROP TABLE IF EXISTS
      simulasi_skenario,
      barang_keluar,
      barang_masuk,
      obat,
      supplier,
      users,
      pengaturan,
      _migrations
    CASCADE
  `)
}

// ─── Commands ─────────────────────────────────────────────────────────────────

/** migrate up — jalankan migration yang belum dijalankan */
async function up() {
  const client = await pool.connect()
  try {
    await ensureTracker(client)
    const executed = await getExecuted(client)
    const pending = getMigrationFiles().filter((f) => !executed.includes(f))

    if (!pending.length) {
      console.log('\n✓  Semua migration sudah up-to-date.\n')
      return
    }

    console.log(`\nMenjalankan ${pending.length} migration:\n`)
    for (const file of pending) await runFile(client, file)
    console.log('\n✓  Migration selesai.\n')
  } finally {
    client.release()
  }
}

/** migrate seed — jalankan seed yang belum dijalankan */
async function seed() {
  const client = await pool.connect()
  try {
    await ensureTracker(client)
    const executed = await getExecuted(client)
    const pending = getSeedFiles().filter((f) => !executed.includes(f))

    if (!pending.length) {
      console.log('\n✓  Semua seed sudah dijalankan.\n')
      return
    }

    console.log(`\nMenjalankan ${pending.length} seed:\n`)
    for (const file of pending) await runFile(client, file)
    console.log('\n✓  Seeding selesai.\n')
  } finally {
    client.release()
  }
}

/** migrate fresh — drop semua tabel, lalu jalankan ulang semua migration + seed */
async function fresh() {
  const client = await pool.connect()
  try {
    console.log('\nMenghapus semua tabel...')
    await dropAll(client)
    console.log('✓  Semua tabel dihapus.\n')

    await ensureTracker(client)
    const all = getAllSqlFiles()

    console.log(`Menjalankan ${all.length} file (migration + seed):\n`)
    for (const file of all) await runFile(client, file)
    console.log('\n✓  Fresh migration + seed selesai.\n')
  } finally {
    client.release()
  }
}

/** migrate reset — drop semua tabel saja, tanpa menjalankan ulang */
async function reset() {
  const client = await pool.connect()
  try {
    console.log('\n⚠️   Menghapus semua tabel (tanpa re-migrate)...')
    await dropAll(client)
    console.log('✓  Database di-reset. Jalankan "migrate up" + "migrate seed" untuk mengisi ulang.\n')
  } finally {
    client.release()
  }
}

/** migrate status — tampilkan status setiap file */
async function status() {
  const client = await pool.connect()
  try {
    await ensureTracker(client)
    const executed = await getExecuted(client)
    const all = getAllSqlFiles()

    const line = '─'.repeat(55)
    console.log(`\nStatus Migration SIMO\n${line}`)
    console.log('  Status  Filename')
    console.log(line)

    for (const file of all) {
      const done = executed.includes(file)
      const icon = done ? '✓ done  ' : '○ pending'
      console.log(`  ${icon}  ${file}`)
    }

    console.log(line)
    console.log(`  ${executed.length}/${all.length} dijalankan\n`)
  } finally {
    client.release()
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const COMMANDS = { up, seed, fresh, reset, status }
const cmd = process.argv[2]

if (!cmd || !COMMANDS[cmd]) {
  console.log(`
Penggunaan: node migrate.js <command>

Commands:
  up      Jalankan migration yang belum dijalankan
  seed    Jalankan seed data yang belum dijalankan
  fresh   Drop semua tabel → migrate ulang → seed ulang
  reset   Drop semua tabel (tanpa re-migrate)
  status  Tampilkan status setiap file migration
`)
  process.exit(0)
}

COMMANDS[cmd]()
  .catch((err) => {
    console.error(`\n❌  Error: ${err.message}\n`)
    process.exit(1)
  })
  .finally(() => pool.end())
