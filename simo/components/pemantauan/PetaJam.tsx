const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
const HARI_PENDEK = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const jam2 = (j: number) => String(j).padStart(2, '0')

// Lima tingkat keburaman biru dari token --primary (tingkat 0 = abu --muted). Warna hanya mempermudah mata;
// angkanya tertulis di keterangan tiap sel, di kalimat "paling ramai", dan di tabel sr-only.
const TINGKAT = ['var(--muted)', 'color-mix(in oklab, var(--primary) 22%, var(--card))', 'color-mix(in oklab, var(--primary) 45%, var(--card))', 'color-mix(in oklab, var(--primary) 72%, var(--card))', 'var(--primary)']

function tingkat(n: number, maks: number) {
  if (n <= 0 || maks <= 0) return 0
  return Math.min(4, 1 + Math.floor((n / maks) * 3.999))
}

interface Props {
  jam: number[][] // 7 x 24, Senin..Minggu x jam 0..23 (WIB)
}

// Peta jam sibuk: baris = hari, kolom = jam. Menjawab "kapan sistem dipakai" (mis. dibanding jam buka apotek).
export default function PetaJam({ jam }: Props) {
  const semua = jam.flat()
  const maks = Math.max(0, ...semua)
  if (maks === 0) {
    return <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">Belum ada aktivitas tercatat pada rentang ini</div>
  }

  // Sel paling ramai (yang pertama bila seri) untuk kalimat ringkasan.
  let hMaks = 0
  let jMaks = 0
  jam.forEach((baris, h) => baris.forEach((n, j) => { if (n > jam[hMaks][jMaks]) { hMaks = h; jMaks = j } }))
  const totalPerHari = jam.map((b) => b.reduce((a, c) => a + c, 0))
  const hariRamai = totalPerHari.indexOf(Math.max(...totalPerHari))

  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        Paling ramai: <b className="font-semibold text-foreground">{HARI[hMaks]} pukul {jam2(jMaks)}.00</b> ({jam[hMaks][jMaks]} aktivitas). Hari tersibuk: <b className="font-semibold text-foreground">{HARI[hariRamai]}</b>.
      </p>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-[30rem]">
          <div className="grid grid-cols-[2rem_repeat(24,1fr)] gap-1">
            {jam.map((baris, h) => (
              <div key={h} className="contents">
                <span className="flex items-center text-xs text-muted-foreground" aria-hidden="true">{HARI_PENDEK[h]}</span>
                {baris.map((n, j) => (
                  <span
                    key={j}
                    title={`${HARI[h]} pukul ${jam2(j)}.00: ${n} aktivitas`}
                    className="h-6 rounded-md"
                    style={{ backgroundColor: TINGKAT[tingkat(n, maks)] }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            ))}
            {/* Sumbu jam: label tiap 3 jam supaya tidak berdesakan. */}
            <span aria-hidden="true" />
            {Array.from({ length: 24 }, (_, j) => (
              <span key={j} className="text-center text-[11px] leading-none text-muted-foreground" aria-hidden="true">
                {j % 3 === 0 ? jam2(j) : ''}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground" aria-hidden="true">
        Sedikit
        {TINGKAT.map((w, i) => <span key={i} className="size-4 rounded-md" style={{ backgroundColor: w }} />)}
        Banyak
      </div>

      <div className="sr-only">
      <table>
        <caption>Aktivitas menurut hari dan jam (WIB)</caption>
        <thead><tr><th>Hari</th><th>Jam sibuk</th><th>Total</th></tr></thead>
        <tbody>
          {jam.map((baris, h) => {
            const j = baris.indexOf(Math.max(...baris))
            return <tr key={h}><td>{HARI[h]}</td><td>{totalPerHari[h] > 0 ? `${jam2(j)}.00 (${baris[j]})` : '-'}</td><td>{totalPerHari[h]}</td></tr>
          })}
        </tbody>
      </table>
      </div>
    </div>
  )
}
