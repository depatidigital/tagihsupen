import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Status, Kategori } from '@prisma/client'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const LOKASI_PRESET = [
  'Pasar Baru Sungai Penuh',
  'Pasar Tradisional',
  'Terminal Sungai Penuh',
  'Alun-alun Kota',
  'Jalan Depati Parbo',
  'Jalan Ahmad Yani',
  'Kawasan Danau Kerinci',
  'Jalan Prof. M. Yamin',
  'Simpang Tiga Gedang',
  'Lokasi Lain (isi manual)',
]

export const KATEGORI_LABEL: Record<Kategori, string> = {
  SAMPAH: 'Sampah & Kebersihan',
  JALAN: 'Jalan Rusak',
  DRAINASE: 'Saluran Air',
  PENERANGAN: 'Lampu Jalan',
  PASAR: 'Ketertiban Pasar',
  LAINNYA: 'Lainnya',
}

export const KATEGORI_EMOJI: Record<Kategori, string> = {
  SAMPAH: '🗑️',
  JALAN: '🚧',
  DRAINASE: '💧',
  PENERANGAN: '💡',
  PASAR: '🏪',
  LAINNYA: '📋',
}

export const KATEGORI_DINAS: Record<Kategori, string> = {
  SAMPAH: 'Dinas LH',
  JALAN: 'Dinas PU',
  DRAINASE: 'Dinas PU',
  PENERANGAN: 'Dinas PU',
  PASAR: 'Dinas Perdagangan',
  LAINNYA: 'Sekretariat',
}

export const STATUS_LABEL: Record<Status, string> = {
  DITERIMA: 'Diterima',
  DITERUSKAN: 'Diteruskan',
  DIPROSES: 'Diproses',
  SELESAI: 'Selesai',
  DITOLAK: 'Ditolak',
}

export const STATUS_COLOR: Record<Status, string> = {
  DITERIMA: '#6B7280',
  DITERUSKAN: '#3B82F6',
  DIPROSES: '#F5C842',
  SELESAI: '#1B4332',
  DITOLAK: '#EF4444',
}

export function formatTanggal(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
}

export function labelJuaraMeter(skor: number): string {
  if (skor >= 80) return 'Sungai Penuh Makin Juara 🏆'
  if (skor >= 60) return 'Terus Bergerak 💪'
  return 'Butuh Tindakan Segera ⚠️'
}

export function colorJuaraMeter(skor: number): string {
  if (skor >= 80) return '#1B4332'
  if (skor >= 60) return '#F5C842'
  return '#EF4444'
}

export function formatJam(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  })
}

export function jamSejak(date: Date | string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60))
}
