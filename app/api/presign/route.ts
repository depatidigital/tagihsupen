import { NextRequest, NextResponse } from 'next/server'
import { presignUpload, s3Key, s3PublicUrl } from '@/lib/s3'
import { z } from 'zod'

const schema = z.object({
  key: z.string().min(1),
  contentType: z.string().startsWith('image/'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { key, contentType } = schema.parse(body)

    const fullKey = s3Key(key)
    const url = await presignUpload(key, contentType)
    const publicUrl = s3PublicUrl(fullKey)

    return NextResponse.json({ url, publicUrl })
  } catch (err) {
    console.error('[POST /api/presign]', err)
    return NextResponse.json({ error: 'Gagal generate presigned URL' }, { status: 500 })
  }
}
