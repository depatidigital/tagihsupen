import { prisma } from '@/lib/prisma'
import { getCachedJuaraMeter } from '@/lib/juara'
import {
  KATEGORI_LABEL, KATEGORI_EMOJI,
  STATUS_LABEL, STATUS_COLOR,
  formatTanggal, labelJuaraMeter, colorJuaraMeter,
} from '@/lib/utils'
import Link from 'next/link'

export const revalidate = 60

async function getStats() {
  const since = new Date()
  since.setDate(1)
  since.setHours(0, 0, 0, 0)

  const [totalBulanIni, totalSelesai, wargaAktif, laporanTerbaru, juaraMeter] = await Promise.all([
    prisma.laporan.count({ where: { createdAt: { gte: since } } }),
    prisma.laporan.count({ where: { createdAt: { gte: since }, status: 'SELESAI' } }),
    prisma.warga.count({ where: { lastActive: { gte: since } } }),
    prisma.laporan.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    getCachedJuaraMeter(),
  ])

  const selesaiDenganWaktu = await prisma.laporan.findMany({
    where: { createdAt: { gte: since }, status: 'SELESAI', selesaiAt: { not: null } },
    select: { createdAt: true, selesaiAt: true },
  })

  let rataJam = 0
  if (selesaiDenganWaktu.length > 0) {
    const totalMs = selesaiDenganWaktu.reduce(
      (acc, l) => acc + (l.selesaiAt!.getTime() - l.createdAt.getTime()), 0
    )
    rataJam = Math.round(totalMs / selesaiDenganWaktu.length / (1000 * 60 * 60))
  }

  return { totalBulanIni, totalSelesai, wargaAktif, laporanTerbaru, juaraMeter, rataJam }
}

export default async function HomePage() {
  const { totalBulanIni, totalSelesai, wargaAktif, laporanTerbaru, juaraMeter, rataJam } =
    await getStats()

  const juaraLabel = labelJuaraMeter(juaraMeter)
  const juaraColor = colorJuaraMeter(juaraMeter)

  const stats = [
    { value: totalBulanIni, label: 'Laporan masuk bulan ini' },
    { value: totalSelesai, label: 'Laporan selesai' },
    { value: `${rataJam}j`, label: 'Rata-rata penanganan' },
    { value: wargaAktif, label: 'Warga aktif' },
  ]

  const fitur = [
    {
      icon: '📊',
      title: 'Juara Meter',
      desc: 'Skor responsivitas kota dihitung otomatis setiap hari. Semakin tinggi, semakin cepat masalah kamu ditangani.',
    },
    {
      icon: '📍',
      title: 'Peta Laporan',
      desc: 'Lihat semua laporan aktif di peta interaktif. Tahu persis di mana masalah sedang terjadi di kotamu.',
    },
    {
      icon: '💬',
      title: 'Update via WhatsApp',
      desc: 'Setiap perubahan status laporan langsung dikirim ke WhatsApp-mu. Tidak perlu cek terus-terusan.',
    },
  ]

  const langkah = [
    {
      no: '01',
      title: 'Lapor masalah',
      desc: 'Isi formulir singkat: kategori, lokasi, deskripsi, dan foto opsional. Butuh kurang dari 2 menit.',
    },
    {
      no: '02',
      title: 'Pantau status',
      desc: 'Kamu dapat nomor tiket unik. Cek progres kapan saja. Update dikirim otomatis ke WhatsApp.',
    },
    {
      no: '03',
      title: 'Terbukti selesai',
      desc: 'Dinas terkait merespons dan menyelesaikan. Foto bukti penanganan diunggah sebagai konfirmasi.',
    },
  ]

  return (
    <>
      {/* ── HERO ── */}
      <section className="bg-primary text-white py-20 lg:py-28 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              🏙️ Platform Laporan Warga · Sungai Penuh, Jambi
            </div>
            <h1 className="text-4xl lg:text-6xl font-extrabold leading-[1.1] mb-6">
              Warga Bersuara,{' '}
              <span className="text-accent">Sungai Penuh</span>{' '}
              Bergerak.
            </h1>
            <p className="text-lg text-white/70 mb-8 max-w-md">
              Laporkan masalah kota langsung ke dinas terkait. Pantau progres. Buktikan suaramu punya dampak nyata.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/lapor"
                className="bg-accent text-primary font-bold px-6 py-3 rounded-xl hover:bg-yellow-300 transition-all active:scale-95"
              >
                Lapor Sekarang →
              </Link>
              <Link
                href="/peta"
                className="bg-white/10 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-all"
              >
                Lihat Peta Laporan
              </Link>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="hidden lg:flex justify-center">
            <div className="relative w-56">
              <div className="bg-white/10 border border-white/20 rounded-[2.5rem] p-3 shadow-2xl">
                <div className="bg-gray-50 rounded-[2rem] p-3 space-y-2 overflow-hidden">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-extrabold text-primary">Tagih Supen</span>
                    <span className="text-[8px] bg-accent text-primary px-2 py-0.5 rounded-full font-bold">Lapor</span>
                  </div>
                  <div className="bg-primary rounded-2xl p-3">
                    <p className="text-[8px] text-white/60 font-semibold uppercase tracking-wider">Juara Meter</p>
                    <p className="text-2xl font-extrabold text-white leading-none mt-0.5">{juaraMeter}%</p>
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${juaraMeter}%` }} />
                    </div>
                  </div>
                  {[
                    { emoji: '🚧', label: 'Jalan Rusak', loc: 'Jl. Depati Parbo', status: 'Diproses', color: '#F5C842', textColor: '#1B4332' },
                    { emoji: '🗑️', label: 'Sampah Menumpuk', loc: 'Pasar Baru', status: 'Selesai', color: '#1B4332', textColor: '#fff' },
                    { emoji: '💡', label: 'Lampu Padam', loc: 'Alun-alun', status: 'Diterima', color: '#6B7280', textColor: '#fff' },
                  ].map((item) => (
                    <div key={item.label} className="bg-white rounded-xl p-2 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-bold text-gray-800 truncate">{item.label}</p>
                          <p className="text-[8px] text-gray-400 truncate">{item.loc}</p>
                        </div>
                        <span
                          className="text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color, color: item.textColor }}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-accent py-10">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl font-extrabold text-primary">{s.value}</p>
              <p className="text-sm font-medium text-primary/70 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CARA KERJA ── */}
      <section id="cara-kerja" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-accent mb-3">Cara Kerja</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900">Tiga langkah, nyata hasilnya</h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">Dari laporan ke penyelesaian — prosesnya transparan dan bisa dipantau.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {langkah.map((l, i) => (
              <div key={l.no} className="relative">
                {i < langkah.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gray-200 z-0" style={{ width: 'calc(100% - 2rem)', transform: 'translateX(1rem)' }} />
                )}
                <div className="relative z-10">
                  <p className="text-5xl font-extrabold text-gray-100 mb-4 leading-none">{l.no}</p>
                  <h3 className="text-xl font-extrabold text-gray-900 mb-2">{l.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{l.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FITUR UNGGULAN ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-accent mb-3">Fitur</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900">Dirancang untuk warga</h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {fitur.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-4xl mb-4">{f.icon}</p>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JUARA METER LIVE ── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-xl mx-auto text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-accent mb-3">Live</p>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Juara Meter Kota</h2>
            <p className="text-gray-500 text-sm mb-10">Skor responsivitas Sungai Penuh berdasarkan laporan warga 30 hari terakhir.</p>
            <div className="bg-primary rounded-3xl p-8 text-white text-left">
              <div className="flex items-end gap-4 mb-4">
                <span className="text-7xl font-extrabold" style={{ color: juaraColor }}>{juaraMeter}%</span>
                <span className="text-lg font-semibold text-white/70 mb-2">{juaraLabel}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
                <div
                  className="h-4 rounded-full transition-all duration-700"
                  style={{ width: `${juaraMeter}%`, backgroundColor: juaraColor }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6 text-center">
                <div>
                  <p className="text-2xl font-extrabold text-accent">{totalBulanIni}</p>
                  <p className="text-[11px] text-white/60 mt-0.5">Laporan masuk</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-accent">{totalSelesai}</p>
                  <p className="text-[11px] text-white/60 mt-0.5">Diselesaikan</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-accent">{rataJam}j</p>
                  <p className="text-[11px] text-white/60 mt-0.5">Rata penanganan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEED LAPORAN ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-accent mb-2">Aktivitas</p>
              <h2 className="text-3xl font-extrabold text-gray-900">Laporan Terbaru</h2>
            </div>
            <Link href="/peta" className="text-sm text-primary font-semibold hover:underline">
              Lihat peta →
            </Link>
          </div>
          <div className="space-y-3 max-w-2xl">
            {laporanTerbaru.map((l) => (
              <Link key={l.id} href={`/tiket/${l.tiketId}`}>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:border-primary hover:shadow-sm transition-all cursor-pointer">
                  <span className="text-2xl">{KATEGORI_EMOJI[l.kategori]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{KATEGORI_LABEL[l.kategori]}</p>
                    <p className="text-xs text-gray-500 truncate">📍 {l.lokasi}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                      style={{ backgroundColor: STATUS_COLOR[l.status] }}
                    >
                      {STATUS_LABEL[l.status]}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{formatTanggal(l.createdAt)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="bg-primary py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-4">
            Ada masalah di kotamu?
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-md mx-auto">
            Suaramu bisa mengubah Sungai Penuh. Lapor sekarang dan ikuti prosesnya sampai selesai.
          </p>
          <Link
            href="/lapor"
            className="inline-block bg-accent text-primary font-bold px-8 py-4 rounded-xl text-lg hover:bg-yellow-300 transition-all active:scale-95"
          >
            Lapor Sekarang →
          </Link>
        </div>
      </section>
    </>
  )
}
