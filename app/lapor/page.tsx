'use client'

import { useState, useRef, useCallback } from 'react'
import { Kategori } from '@prisma/client'
import { LOKASI_PRESET, KATEGORI_LABEL } from '@/lib/utils'
import { KATEGORI_ICON } from '@/lib/icons'
import { checkImageQuality, type ImageIssue } from '@/lib/check-image'
import {
  Camera, Bot, MapPin, Navigation, CheckCircle2,
  Signal, AlertTriangle, MessageCircle, Check,
} from 'lucide-react'

type Step = 1 | 2 | 3 | 4 | 5

const STEP_LABELS = ['Foto', 'Analisa', 'Kategori', 'Detail', 'Konfirmasi']

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
  const form = new FormData()
  form.append('file', file)
  form.append('key', key)
  const res = await fetch('/api/upload', { method: 'POST', body: form })
  if (!res.ok) throw new Error('Gagal mengunggah foto')
  const { publicUrl } = await res.json()
  return publicUrl
}

export default function LaporPage() {
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
  const [lokasiIsGPS, setLokasiIsGPS] = useState(true)
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'detecting' | 'ok' | 'error'>('idle')
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [form, setForm] = useState({ deskripsi: '', nama: '', lokasi: 'GPS', lokasiManual: '' })
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError] = useState('')
  const [tiketId, setTiketId] = useState('')
  const [waLink, setWaLink] = useState('')

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
      let lokasi: string
      let lat: number | null = null
      let lng: number | null = null
      if (lokasiIsGPS) {
        if (!gpsCoords) throw new Error('Posisi GPS belum terdeteksi')
        lokasi = `GPS (${gpsCoords.lat.toFixed(5)}, ${gpsCoords.lng.toFixed(5)})`
        lat = gpsCoords.lat
        lng = gpsCoords.lng
      } else if (lokasiIsManual) {
        lokasi = form.lokasiManual
        if (!lokasi) throw new Error('Isi nama lokasi')
      } else {
        lokasi = form.lokasi
        if (!lokasi) throw new Error('Pilih lokasi')
      }

      const res = await fetch('/api/laporan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: form.nama, kategori, deskripsi: form.deskripsi, lokasi, lat, lng, foto: [] }),
      })
      if (!res.ok) {
        const { error: msg } = await res.json()
        throw new Error(msg ?? 'Gagal mengirim laporan')
      }
      const result = await res.json()

      setUploadProgress('Mengunggah foto...')
      const fotoUrl = await uploadFoto(foto, result.tiketId)
      await fetch(`/api/laporan/${result.tiketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foto: [fotoUrl] }),
      })

      setTiketId(result.tiketId)
      setWaLink(result.waLink ?? '')
      setStep(5)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
      setUploadProgress('')
    }
  }

  function detectGPS() {
    if (!navigator.geolocation) { setGpsStatus('error'); return }
    setGpsStatus('detecting')
    setGpsCoords(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsStatus('ok') },
      () => setGpsStatus('error'),
      { timeout: 10000, enableHighAccuracy: true }
    )
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
                <div className={[
                  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all shrink-0',
                  done ? 'bg-primary text-white' : active ? 'bg-accent text-primary' : 'bg-gray-100 text-gray-400',
                ].join(' ')}>
                  {done ? <Check size={14} /> : n}
                </div>
                <span className={['ml-1.5 text-xs font-medium hidden sm:inline', active ? 'text-primary' : 'text-gray-400'].join(' ')}>
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
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
            {!fotoPreview ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 bg-gray-50 hover:bg-gray-100 active:scale-98 transition-all"
              >
                <Camera size={48} className="text-gray-300" />
                <span className="text-base font-semibold text-gray-600">Ambil Foto Masalah</span>
                <span className="text-xs text-gray-400">Tap untuk buka kamera</span>
              </button>
            ) : (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fotoPreview} alt="Preview foto" className="w-full aspect-[4/3] object-cover rounded-2xl" />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute top-3 right-3 bg-black/50 text-white text-xs px-3 py-1.5 rounded-xl backdrop-blur-sm"
                >
                  Ganti Foto
                </button>
              </div>
            )}
            {checkingImage && <p className="text-sm text-gray-400 text-center animate-pulse">Memeriksa kualitas foto...</p>}
            {imageIssues.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-semibold text-yellow-800">Peringatan Kualitas Foto</p>
                {imageIssues.map((issue) => (
                  <p key={issue.code} className="text-xs text-yellow-700 flex items-center gap-1"><AlertTriangle size={11} /> {issue.message}</p>
                ))}
                <p className="text-xs text-yellow-600 pt-1">Bisa tetap dilanjutkan — foto lebih jelas mempercepat penanganan.</p>
              </div>
            )}
            {fotoPreview && !checkingImage && (
              <button type="button" onClick={handleAnalisa} className="btn-primary w-full text-center">
                Analisa dengan AI →
              </button>
            )}
          </div>
        )}

        {/* ── STEP 2: LOADING AI ── */}
        {step === 2 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot size={40} className="text-primary animate-pulse" />
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
                <p className="text-lg font-bold text-primary flex items-center gap-2">
                  {(() => { const Icon = KATEGORI_ICON[kategoriAI]; return <Icon size={18} /> })()}
                  {KATEGORI_LABEL[kategoriAI]}
                </p>
                {alasanAI && <p className="text-xs text-gray-500 mt-1">{alasanAI}</p>}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-500">
                  {aiFailed ? 'AI tidak dapat mendeteksi. Pilih kategori secara manual.' : 'Pilih kategori masalah.'}
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
                    kategori === k ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:border-primary hover:bg-green-50',
                  ].join(' ')}
                >
                  {(() => { const Icon = KATEGORI_ICON[k]; return <Icon size={16} className="shrink-0" /> })()}
                  <span className="leading-tight">{label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={!kategori}
              onClick={() => { setStep(4); if (gpsStatus === 'idle') detectGPS() }}
              className="btn-primary w-full text-center disabled:opacity-40"
            >
              Lanjut →
            </button>
            <button type="button" onClick={resetToStep1} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-1">
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
                className={['input min-h-[100px] resize-none', form.deskripsi.length > 0 && form.deskripsi.length < 10 ? 'border-red-400 focus:ring-red-400' : ''].join(' ')}
                value={form.deskripsi}
                onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
                placeholder="Jelaskan masalah yang kamu temukan... (min. 10 karakter)"
                minLength={10}
                required
              />
              {form.deskripsi.length > 0 && form.deskripsi.length < 10 && (
                <p className="text-xs text-red-500 mt-1">⚠️ Minimal 10 karakter ({form.deskripsi.length}/10)</p>
              )}
            </div>

            <div>
              <label className="label">Nama Lengkap *</label>
              <input
                className={['input', form.nama.length > 0 && form.nama.length < 2 ? 'border-red-400 focus:ring-red-400' : ''].join(' ')}
                value={form.nama}
                onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                placeholder="Nama kamu"
                minLength={2}
                required
              />
              {form.nama.length === 1 && <p className="text-xs text-red-500 mt-1">⚠️ Nama terlalu pendek</p>}
            </div>

            <div>
              <label className="label">Lokasi *</label>
              <select
                className="input"
                value={lokasiIsGPS ? 'GPS' : lokasiIsManual ? 'Lokasi Lain (isi manual)' : form.lokasi}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === 'GPS') {
                    setLokasiIsGPS(true); setLokasiIsManual(false)
                    if (gpsStatus === 'idle') detectGPS()
                  } else if (v === 'Lokasi Lain (isi manual)') {
                    setLokasiIsGPS(false); setLokasiIsManual(true)
                    setForm((f) => ({ ...f, lokasi: v }))
                  } else {
                    setLokasiIsGPS(false); setLokasiIsManual(false)
                    setForm((f) => ({ ...f, lokasi: v }))
                  }
                }}
              >
                <option value="GPS">📍 Gunakan Posisi Saya</option>
                {LOKASI_PRESET.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              {lokasiIsGPS && (
                <div className="mt-2">
                  {gpsStatus === 'idle' && (
                    <button type="button" onClick={detectGPS} className="text-sm text-primary font-medium flex items-center gap-1.5">
                      <Navigation size={14} /> Deteksi posisi sekarang
                    </button>
                  )}
                  {gpsStatus === 'detecting' && (
                    <p className="text-sm text-gray-400 animate-pulse flex items-center gap-1.5">
                      <Signal size={14} /> Mendeteksi posisi GPS...
                    </p>
                  )}
                  {gpsStatus === 'ok' && gpsCoords && (
                    <p className="text-sm text-green-600 font-medium flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Posisi terdeteksi ({gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)})
                      <button type="button" onClick={detectGPS} className="text-xs text-gray-400 underline">Perbarui</button>
                    </p>
                  )}
                  {gpsStatus === 'error' && (
                    <div className="text-sm text-red-500">
                      Gagal mendapat posisi.{' '}
                      <button type="button" onClick={detectGPS} className="underline">Coba lagi</button>
                      {' '}atau pilih lokasi manual di atas.
                    </div>
                  )}
                </div>
              )}
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

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{error}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full text-center disabled:opacity-60">
              {loading ? (uploadProgress || 'Mengirim...') : 'Simpan & Lanjut →'}
            </button>

            <button type="button" onClick={() => setStep(3)} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-1">
              ← Kembali
            </button>
          </form>
        )}

        {/* ── STEP 5: KONFIRMASI WA ── */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
              <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
              <p className="text-base font-bold text-primary mb-1">Laporan Tersimpan!</p>
              <p className="text-sm text-gray-500">Tiket <span className="font-semibold text-primary">{tiketId}</span></p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
              <p className="text-sm font-semibold text-blue-900">Satu langkah lagi 👇</p>
              <p className="text-sm text-blue-800">
                Konfirmasi laporan kamu via WhatsApp agar nomor HP kamu terverifikasi dan laporan langsung diproses.
              </p>
              <div className="bg-white rounded-xl border border-blue-100 px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">Pesan yang akan dikirim:</p>
                <p className="text-sm font-mono font-semibold text-gray-800">LAPOR {tiketId}</p>
              </div>
              <p className="text-xs text-gray-400">
                Tap tombol di bawah → WhatsApp terbuka → tap Kirim. Selesai.
              </p>
            </div>

            {waLink ? (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full text-center flex items-center justify-center gap-2 no-underline"
              >
                <MessageCircle size={18} />
                <span>Kirim via WhatsApp</span>
              </a>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
                Nomor WhatsApp operator belum dikonfigurasi. Hubungi admin.
              </div>
            )}

            <p className="text-xs text-gray-400 text-center">
              Laporan otomatis dikonfirmasi begitu pesan WA diterima.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
