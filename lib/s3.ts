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
  return getSignedUrl(s3, cmd, { expiresIn: 300 })
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}
