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
        <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <a href="/" className="font-extrabold text-primary text-lg tracking-tight">
              Tagih Supen
            </a>
            <div className="flex items-center gap-6">
              <a href="/#cara-kerja" className="hidden sm:block text-sm text-gray-600 hover:text-primary font-medium transition-colors">
                Cara Kerja
              </a>
              <a href="/peta" className="hidden sm:block text-sm text-gray-600 hover:text-primary font-medium transition-colors">
                Peta Laporan
              </a>
              <a href="/lapor" className="btn-accent text-sm py-2 px-4">
                Lapor Sekarang
              </a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="bg-gray-950 text-gray-400 py-10">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-extrabold text-white text-base">Tagih Supen</p>
              <p className="text-xs mt-0.5">Warga Bersuara, Sungai Penuh Bergerak.</p>
            </div>
            <div className="flex gap-6 text-xs">
              <a href="/lapor" className="hover:text-white transition-colors">Lapor Masalah</a>
              <a href="/peta" className="hover:text-white transition-colors">Peta Laporan</a>
            </div>
            <p className="text-xs text-center sm:text-right">
              Dibangun oleh{' '}
              <span className="text-white font-semibold">Depati Digital</span>
              <br />Sungai Penuh, Jambi
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
