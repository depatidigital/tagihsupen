import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-5xl mb-4">🔍</p>
      <h1 className="text-2xl font-extrabold text-primary mb-2">Halaman tidak ditemukan</h1>
      <p className="text-gray-500 mb-6">Tiket atau halaman yang kamu cari tidak ada.</p>
      <Link href="/" className="btn-primary inline-block">Kembali ke beranda</Link>
    </div>
  )
}
