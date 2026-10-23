// Komponen bantu bersama untuk halaman style guide (/design/*). Prefix _
// supaya Next.js tidak menganggapnya sebagai route.

export function PageHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="text-sm text-gray-500 mt-1 max-w-2xl">{desc}</p>
    </div>
  )
}

export function Section({ title, desc, meta, children }: { title: string; desc?: string; meta?: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          {desc && <p className="text-sm text-gray-500 mt-0.5">{desc}</p>}
        </div>
        {meta && <code className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded-md flex-shrink-0 whitespace-nowrap">{meta}</code>}
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {children}
      </div>
    </section>
  )
}

export function Swatch({ name, token, className, hex }: { name: string; token?: string; className: string; hex: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`h-16 rounded-lg ${className}`} />
      <p className="text-xs font-medium text-gray-700">{name}</p>
      {token && <p className="text-[11px] text-gray-500 font-mono">{token}</p>}
      <p className="text-[11px] text-gray-400 font-mono">{hex}</p>
    </div>
  )
}
