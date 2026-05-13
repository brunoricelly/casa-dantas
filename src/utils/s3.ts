import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { getEnv } from './env';

function cleanBaseUrl(url: string) {
  return url.replace(/\/$/, '');
}

function getExtension(originalName: string, mimetype: string) {
  const byName = originalName.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase();
  if (byName) return byName;

  const byMime = mimetype.split('/').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase();
  return byMime || 'bin';
}

function requireEnv(key: Parameters<typeof getEnv>[0]) {
  const value = getEnv(key);
  if (!value) {
    throw new Error(`${key} não configurado.`);
  }
  return value;
}

function createS3Client() {
  const accessKeyId = requireEnv('S3_ACCESS_KEY_ID');
  const secretAccessKey = requireEnv('S3_SECRET_ACCESS_KEY');

  return new S3Client({
    region: getEnv('S3_REGION', 'auto'),
    endpoint: requireEnv('S3_ENDPOINT'),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
    // Cloudflare R2 is S3-compatible, but older/newer AWS SDK defaults can add
    // checksum headers that are not required for this upload flow. Keeping them
    // opt-in avoids compatibility regressions during deploys.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

export async function uploadImage(buffer: Buffer, mimetype: string, originalName: string) {
  const bucket = getEnv('S3_BUCKET');
  if (!bucket) throw new Error('S3_BUCKET não configurado.');

  const extension = getExtension(originalName, mimetype);
  const fileName = `catalogo/${uuidv4()}.${extension}`;

  await createS3Client().send(new PutObjectCommand({
    Bucket: bucket,
    Key: fileName,
    Body: buffer,
    ContentType: mimetype || 'application/octet-stream',
  }));

  const publicBaseUrl = requireEnv('S3_PUBLIC_URL');

  return `${cleanBaseUrl(publicBaseUrl)}/${fileName}`;
}
