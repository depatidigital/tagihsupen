import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { putObject } from '@/lib/s3'

const MAX_DIMENSION = 1920
const WEBP_QUALITY = 75

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const key = form.get('key') as string | null

    if (!file || !key) {
      return NextResponse.json({ error: 'file dan key wajib ada' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Hanya file gambar yang diizinkan' }, { status: 400 })
    }

    const raw = Buffer.from(await file.arrayBuffer())
    const compressed = await sharp(raw)
      .rotate()                          // auto-rotate from EXIF
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: JPEG_QUALITY })
      .toBuffer()

    const outputKey = key.replace(/\.[^.]+$/, '.webp')
    const publicUrl = await putObject(outputKey, compressed, 'image/webp')

    return NextResponse.json({ publicUrl })
  } catch (err) {
    console.error('[POST /api/upload]', err)
    return NextResponse.json({ error: 'Gagal mengunggah file' }, { status: 500 })
  }
}
