import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET;
const publicUrl = process.env.R2_PUBLIC_URL;

/** True only when every R2 env var is present (server-side). */
export const isR2Configured = Boolean(
  endpoint && accessKeyId && secretAccessKey && bucket && publicUrl
);

let client: S3Client | null = null;
function getClient() {
  if (!isR2Configured) return null;
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    });
  }
  return client;
}

/** Upload bytes to R2 and return the public URL. */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const s3 = getClient();
  if (!s3) throw new Error('R2 not configured');
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket!,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
  return `${publicUrl!.replace(/\/$/, '')}/${key}`;
}
