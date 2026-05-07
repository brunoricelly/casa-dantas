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

function createS3Client() {
  const accessKeyId = getEnv('S3_ACCESS_KEY_ID');
  const secretAccessKey = getEnv('S3_SECRET_ACCESS_KEY');

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Credenciais S3 não configuradas.');
  }

  return new S3Client({
    region: getEnv('S3_REGION', 'garage'),
    endpoint: getEnv('S3_ENDPOINT', 'https://storage.chatwoot.space'),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
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

  const publicBaseUrl =
    getEnv('S3_PUBLIC_URL') ||
    'https://files.chatwoot.space';

  return `${cleanBaseUrl(publicBaseUrl)}/${fileName}`;
}
