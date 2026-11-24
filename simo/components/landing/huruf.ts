import { Instrument_Serif } from 'next/font/google'

// Huruf judul halaman depan (serif editorial, dengan versi miring untuk kata yang ditekankan).
// Di-host sendiri oleh next/font: browser pengunjung tidak menghubungi Google.
export const hurufSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})
