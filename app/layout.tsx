import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tagih Supen — Warga Bersuara, Sungai Penuh Bergerak',
  description: 'Platform pelaporan masalah kota untuk warga Sungai Penuh. Lapor, pantau, dan buktikan bahwa suaramu punya dampak nyata.',
  openGraph: {
    title: 'Tagih Supen',
    description: 'Warga Bersuara, Sungai Penuh Bergerak.',
    siteName: 'Tagih Supen',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <nav className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="font-extrabold text-primary text-lg tracking-tight">
              Tagih Supen
            </a>
            <a href="/lapor" className="btn-accent text-sm py-2 px-4">
              Lapor Sekarang
            </a>
          </div>
        </nav>
        <main className="max-w-2xl mx-auto px-4 pb-16">{children}</main>
        <footer className="text-center text-xs text-gray-400 py-8">
          <p>Tagih Supen · Warga Bersuara, Sungai Penuh Bergerak.</p>
          <p className="mt-1">Dibangun oleh Depati Digital · Sungai Penuh, Jambi</p>
        </footer>
      </body>
    </html>
  )
}
