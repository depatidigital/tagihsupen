'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LOKASI_PRESET, KATEGORI_LABEL } from '@/lib/utils'
import { Kategori } from '@prisma/client'

export default function LaporPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lokasiManual, setLokasiManual] = useState(false)
  const [fotos, setFotos] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<string>('')

  const [form, setForm] = useState({
    nama: '',
    whatsapp: '',
    kategori: '' as Kategori | '',
    deskripsi: '',
    lokasi: '',
    lokasiManualValue: '',
    lat: '',
    lng: '',
  })

  function handleLokasiChange(val: string) {
    if (val === 'Lokasi Lain (isi manual)') {
      setLokasiManual(true)
      setForm((f) => ({ ...f, lokasi: val }))
    } else {
      setLokasiManual(false)
      setForm((f) => ({ ...f, lokasi: val }))
    }
  }

  async function uploadFoto(file: File, tiketId: string, index: number): Promise<string> {
    const ext = file.name.split('.').pop()
    const key = `laporan/${tiketId}/${index}.${ext}`

    const res = await fetch('/api/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, contentType: file.type }),
    })
    const { url, publicUrl } = await res.json()

    await fetch(url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })

    return publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const lokasi = lokasiManual ? form.lokasiManualValue : form.lokasi
      if (!lokasi) throw new Error('Pilih atau isi lokasi')

      const payload = {
        nama: form.nama,
        whatsapp: form.whatsapp,
        kategori: form.kategori,
        deskripsi: form.deskripsi,
        lokasi,
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,
        foto: [] as string[],
      }

      // Create laporan first to get tiketId
      const res = await fetch('/api/laporan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const { error: msg } = await res.json()
        throw new Error(msg ?? 'Gagal mengirim laporan')
      }

      const { tiketId } = await res.json()

      // Upload fotos if any
      if (fotos.length > 0) {
        setUploadProgress('Mengunggah foto...')
        const urls: string[] = []
        for (let i = 0; i < fotos.length; i++) {
          const url = await uploadFoto(fotos[i], tiketId, i)
          urls.push(url)
        }
        // Update laporan with foto URLs
        await fetch(`/api/laporan/${tiketId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foto: urls }),
        })
      }

      router.push(`/tiket/${tiketId}?baru=1`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
      setUploadProgress('')
    }
  }

  return (
    <div className="py-6">
      <h1 className="text-2xl font-extrabold text-primary mb-1">Lapor Masalah</h1>
      <p className="text-sm text-gray-500 mb-6">Suaramu penting. Isi dengan jelas agar cepat ditangani.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label className="label">Nomor WhatsApp *</label>
          <input
            className="input"
            value={form.whatsapp}
            onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
            placeholder="08xxxxxxxxxx"
            type="tel"
            required
          />
          <p className="text-xs text-gray-400 mt-1">Update status laporan akan dikirim ke nomor ini</p>
        </div>

        <div>
          <label className="label">Kategori Masalah *</label>
          <select
            className="input"
            value={form.kategori}
            onChange={(e) => setForm((f) => ({ ...f, kategori: e.target.value as Kategori }))}
            required
          >
            <option value="">Pilih kategori...</option>
            {Object.entries(KATEGORI_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Lokasi *</label>
          <select
            className="input"
            value={form.lokasi}
            onChange={(e) => handleLokasiChange(e.target.value)}
            required={!lokasiManual}
          >
            <option value="">Pilih lokasi...</option>
            {LOKASI_PRESET.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          {lokasiManual && (
            <input
              className="input mt-2"
              value={form.lokasiManualValue}
              onChange={(e) => setForm((f) => ({ ...f, lokasiManualValue: e.target.value }))}
              placeholder="Tulis nama lokasi lengkap"
              required
            />
          )}
        </div>

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
          <label className="label">Foto (opsional, maks 3)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            className="input py-2 text-sm"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []).slice(0, 3)
              setFotos(files)
            }}
          />
          {fotos.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">{fotos.length} foto dipilih</p>
          )}
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
          {loading ? (uploadProgress || 'Mengirim...') : 'Kirim Laporan'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Dengan mengirim, kamu membantu Sungai Penuh selangkah lebih dekat ke Juara.
        </p>
      </form>
    </div>
  )
}
