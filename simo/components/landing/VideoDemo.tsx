'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { YOUTUBE_ID_DEMO } from '@/lib/landing'
import gaya from './landing.module.css'
import fotoDashboard from '@/public/landing/dashboard.webp'

// Blok video demo 16:9 di atas panggung gelap. Pola "fasad": sebelum diklik hanya gambar sampul + tombol putar
// (halaman tetap ringan, YouTube tidak dimuat dan tidak memasang cookie). Setelah diklik baru iframe
// youtube-nocookie dimuat dan diputar. Selama YOUTUBE_ID_DEMO kosong, tampil keterangan "segera hadir".
export default function VideoDemo() {
  const [putar, setPutar] = useState(false)
  const id = YOUTUBE_ID_DEMO.trim()

  if (!id) {
    return (
      <div className={`relative aspect-video overflow-hidden ${gaya.bingkai}`}>
        <div className="relative size-full overflow-hidden rounded-[0.9rem]">
          <Image src={fotoDashboard} alt="" fill sizes="(min-width: 1024px) 960px, 100vw" className="scale-105 object-cover object-left-top blur-[3px]" />
          <div className="absolute inset-0 bg-[oklch(0.19_0.04_264)]/70" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25 backdrop-blur-md sm:size-20">
              <Play className="ml-1 size-7 fill-white text-white sm:size-8" aria-hidden="true" />
            </span>
            <p className="mt-5 text-lg font-semibold text-white sm:text-xl">Video demo segera hadir</p>
            <p className="mt-1.5 max-w-sm text-sm text-white/70 sm:text-base">Tur tiga menit: dari masuk sampai mencatat penjualan.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative aspect-video overflow-hidden ${gaya.bingkai}`}>
      {putar ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&cc_load_policy=1&hl=id`}
          title="Video demo SIMO"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="size-full rounded-[0.9rem]"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPutar(true)}
          aria-label="Putar video demo SIMO"
          className="group relative block size-full overflow-hidden rounded-[0.9rem] outline-none focus-visible:ring-4 focus-visible:ring-white/60"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- gambar sampul dari YouTube; next/image butuh izin domain di next.config */}
          <img
            src={`https://i.ytimg.com/vi/${encodeURIComponent(id)}/maxresdefault.jpg`}
            alt=""
            loading="lazy"
            className="size-full object-cover motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-[1.02]"
          />
          <span className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/15" aria-hidden="true" />
          <span className="absolute left-1/2 top-1/2 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[oklch(0.19_0.04_264)] shadow-2xl motion-safe:transition-transform group-hover:scale-105" aria-hidden="true">
            <Play className="ml-1 size-8 fill-current" />
          </span>
        </button>
      )}
    </div>
  )
}
