import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT!,
  region: process.env.S3_REGION ?? 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
})

const BUCKET = process.env.S3_BUCKET_NAME!
const ROOT = process.env.S3_ROOT_DIR ?? 'tagihsupen'
const PUBLIC_URL = process.env.S3_PUBLIC_URL!

export function s3Key(path: string) {
  return `${ROOT}/${path}`
}

export function s3PublicUrl(key: string) {
  return `${PUBLIC_URL}/${key.replace(`${ROOT}/`, '')}`
}

export async function presignUpload(key: string, contentType: string): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: s3Key(key),
    ContentType: contentType,
  })
  const signed = await getSignedUrl(s3, cmd, { expiresIn: 300 })
  // Replace internal S3_ENDPOINT with public-facing URL so browser can reach it
  const internalOrigin = new URL(process.env.S3_ENDPOINT!).origin
  const publicOrigin = new URL(PUBLIC_URL).origin
  return signed.replace(internalOrigin, publicOrigin)
}

export async function putObject(key: string, body: Buffer, contentType: string): Promise<string> {
  const fullKey = s3Key(key)
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: fullKey,
    Body: body,
    ContentType: contentType,
  }))
  return s3PublicUrl(fullKey)
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}
