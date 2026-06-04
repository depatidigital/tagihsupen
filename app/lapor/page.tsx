'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Kategori } from '@prisma/client'
import { LOKASI_PRESET, KATEGORI_LABEL, KATEGORI_EMOJI } from '@/lib/utils'
import { checkImageQuality, type ImageIssue } from '@/lib/check-image'

type Step = 1 | 2 | 3 | 4

const STEP_LABELS = ['Foto', 'Analisa', 'Kategori', 'Detail']

async function resizeForAI(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 512
      let w = img.naturalWidth
      let h = img.naturalHeight
      if (w > MAX || h > MAX) {
        const r = Math.min(MAX / w, MAX / h)
        w = Math.round(w * r)
        h = Math.round(h * r)
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' })
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Gagal memuat gambar')) }
    img.src = url
  })
}

async function uploadFoto(file: File, tiketId: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const key = `laporan/${tiketId}/0.${ext}`
  const res = await fetch('/api/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, contentType: file.type }),
  })
  const { url, publicUrl } = await res.json()
  await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
  return publicUrl
}

export default function LaporPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>(1)
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [imageIssues, setImageIssues] = useState<ImageIssue[]>([])
  const [checkingImage, setCheckingImage] = useState(false)
  const [kategoriAI, setKategoriAI] = useState<Kategori | null>(null)
  const [alasanAI, setAlasanAI] = useState<string>('')
  const [aiFailed, setAiFailed] = useState(false)
  const [kategori, setKategori] = useState<Kategori | null>(null)
  const [lokasiIsManual, setLokasiIsManual] = useState(false)
  const [form, setForm] = useState({
    deskripsi: '',
    nama: '',
    lokasi: '',
    lokasiManual: '',
    whatsapp: '',
  })
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError] = useState('')

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCheckingImage(true)
    setImageIssues([])
    if (fotoPreview) URL.revokeObjectURL(fotoPreview)
    const preview = URL.createObjectURL(file)
    setFoto(file)
    setFotoPreview(preview)
    const result = await checkImageQuality(file)
    setImageIssues(result.issues)
    setCheckingImage(false)
  }, [fotoPreview])

  async function handleAnalisa() {
    if (!foto) return
    setStep(2)
    setAiFailed(false)
    setKategoriAI(null)
    setAlasanAI('')
    try {
      const { base64, mimeType } = await resizeForAI(foto)
      const res = await fetch('/api/analyze-foto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      })
      if (!res.ok) throw new Error('AI error')
      const data = await res.json()
      setKategoriAI(data.kategori)
      setAlasanAI(data.alasan ?? '')
      setKategori(data.kategori)
    } catch {
      setAiFailed(true)
    }
    setStep(3)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!kategori || !foto) return
    setLoading(true)
    setError('')
    try {
      const lokasi = lokasiIsManual ? form.lokasiManual : form.lokasi
      if (!lokasi) throw new Error('Pilih atau isi lokasi')

      const res = await fetch('/api/laporan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: form.nama,
          whatsapp: form.whatsapp,
          kategori,
          deskripsi: form.deskripsi,
          lokasi,
          lat: null,
          lng: null,
          foto: [],
        }),
      })
      if (!res.ok) {
        const { error: msg } = await res.json()
        throw new Error(msg ?? 'Gagal mengirim laporan')
      }
      const { tiketId } = await res.json()

      setUploadProgress('Mengunggah foto...')
      const fotoUrl = await uploadFoto(foto, tiketId)
      await fetch(`/api/laporan/${tiketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foto: [fotoUrl] }),
      })

      router.push(`/tiket/${tiketId}?baru=1`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
      setUploadProgress('')
    }
  }

  function resetToStep1() {
    setStep(1)
    setKategoriAI(null)
    setAlasanAI('')
    setKategori(null)
    setAiFailed(false)
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-16">
      <div className="py-6">
        <h1 className="text-2xl font-extrabold text-primary mb-1">Lapor Masalah</h1>
        <p className="text-sm text-gray-500 mb-6">Suaramu penting. Isi dengan jelas agar cepat ditangani.</p>

        {/* Step indicator */}
        <div className="flex items-center mb-8">
          {STEP_LABELS.map((label, i) => {
            const n = (i + 1) as Step
            const active = n === step
            const done = n < step
            return (
              <div key={n} className="flex items-center flex-1 last:flex-none">
                <div
                  className={[
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all shrink-0',
                    done ? 'bg-primary text-white' : active ? 'bg-accent text-primary' : 'bg-gray-100 text-gray-400',
                  ].join(' ')}
                >
                  {done ? '✓' : n}
                </div>
                <span
                  className={[
                    'ml-1.5 text-xs font-medium hidden sm:inline',
                    active ? 'text-primary' : 'text-gray-400',
                  ].join(' ')}
                >
                  {label}
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <div className={['flex-1 h-0.5 mx-2', done ? 'bg-primary' : 'bg-gray-100'].join(' ')} />
                )}
              </div>
            )
          })}
        </div>

        {/* ── STEP 1: FOTO ── */}
        {step === 1 && (
          <div className="space-y-4">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            {!fotoPreview ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 bg-gray-50 hover:bg-gray-100 active:scale-98 transition-all"
              >
                <span className="text-5xl">📷</span>
                <span className="text-base font-semibold text-gray-600">Ambil Foto Masalah</span>
                <span className="text-xs text-gray-400">Tap untuk buka kamera</span>
              </button>
            ) : (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fotoPreview}
                  alt="Preview foto"
                  className="w-full aspect-[4/3] object-cover rounded-2xl"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute top-3 right-3 bg-black/50 text-white text-xs px-3 py-1.5 rounded-xl backdrop-blur-sm"
                >
                  Ganti Foto
                </button>
              </div>
            )}

            {checkingImage && (
              <p className="text-sm text-gray-400 text-center animate-pulse">Memeriksa kualitas foto...</p>
            )}

            {imageIssues.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-semibold text-yellow-800">Peringatan Kualitas Foto</p>
                {imageIssues.map((issue) => (
                  <p key={issue.code} className="text-xs text-yellow-700">⚠️ {issue.message}</p>
                ))}
                <p className="text-xs text-yellow-600 pt-1">
                  Bisa tetap dilanjutkan — foto lebih jelas mempercepat penanganan.
                </p>
              </div>
            )}

            {fotoPreview && !checkingImage && (
              <button
                type="button"
                onClick={handleAnalisa}
                className="btn-primary w-full text-center"
              >
                Analisa dengan AI →
              </button>
            )}
          </div>
        )}

        {/* ── STEP 2: LOADING AI ── */}
        {step === 2 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-4xl animate-pulse">🤖</span>
            </div>
            <p className="text-base font-semibold text-gray-700">AI sedang menganalisa foto...</p>
            <p className="text-xs text-gray-400">Mendeteksi jenis masalah</p>
          </div>
        )}

        {/* ── STEP 3: KATEGORI ── */}
        {step === 3 && (
          <div className="space-y-4">
            {kategoriAI && !aiFailed ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-xs font-medium text-green-600 mb-1">AI Mendeteksi</p>
                <p className="text-lg font-bold text-primary">
                  {KATEGORI_EMOJI[kategoriAI]} {KATEGORI_LABEL[kategoriAI]}
                </p>
                {alasanAI && <p className="text-xs text-gray-500 mt-1">{alasanAI}</p>}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-500">
                  {aiFailed
                    ? 'AI tidak dapat mendeteksi. Pilih kategori secara manual.'
                    : 'Pilih kategori masalah.'}
                </p>
              </div>
            )}

            <p className="text-sm font-medium text-gray-700">
              {kategoriAI && !aiFailed ? 'Konfirmasi atau ganti kategori:' : 'Pilih kategori:'}
            </p>

            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(KATEGORI_LABEL) as [Kategori, string][]).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKategori(k)}
                  className={[
                    'flex items-center gap-2 p-3 rounded-xl border text-sm font-medium text-left transition-all',
                    kategori === k
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-primary hover:bg-green-50',
                  ].join(' ')}
                >
                  <span className="shrink-0">{KATEGORI_EMOJI[k]}</span>
                  <span className="leading-tight">{label}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={!kategori}
              onClick={() => setStep(4)}
              className="btn-primary w-full text-center disabled:opacity-40"
            >
              Lanjut →
            </button>

            <button
              type="button"
              onClick={resetToStep1}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-1"
            >
              ← Ganti Foto
            </button>
          </div>
        )}

        {/* ── STEP 4: DETAIL ── */}
        {step === 4 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Deskripsi Masalah *</label>
              <textarea
                className="input min-h-[100px] resize-none"
                value={form.deskripsi}
                onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
                placeholder="Jelaskan masalah yang kamu temukan..."
                required
              />
            </div>

            <div>
              <label className="label">Nama Lengkap *</label>
              <input
                className="input"
                value={form.nama}
                onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                placeholder="Nama kamu"
                required
              />
            </div>

            <div>
              <label className="label">Lokasi *</label>
              <select
                className="input"
                value={form.lokasi}
                onChange={(e) => {
                  const v = e.target.value
                  setLokasiIsManual(v === 'Lokasi Lain (isi manual)')
                  setForm((f) => ({ ...f, lokasi: v }))
                }}
                required={!lokasiIsManual}
              >
                <option value="">Pilih lokasi...</option>
                {LOKASI_PRESET.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              {lokasiIsManual && (
                <input
                  className="input mt-2"
                  value={form.lokasiManual}
                  onChange={(e) => setForm((f) => ({ ...f, lokasiManual: e.target.value }))}
                  placeholder="Tulis nama lokasi lengkap"
                  required
                />
              )}
            </div>

            <div>
              <label className="label">Nomor WhatsApp *</label>
              <input
                className="input"
                type="tel"
                value={form.whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                placeholder="08xxxxxxxxxx"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Update status laporan dikirim ke nomor ini</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center disabled:opacity-60"
            >
              {loading ? (uploadProgress || 'Mengirim...') : 'Kirim Laporan 🚀'}
            </button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-1"
            >
              ← Kembali
            </button>

            <p className="text-xs text-gray-400 text-center">
              Dengan mengirim, kamu membantu Sungai Penuh selangkah lebih dekat ke Juara.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
