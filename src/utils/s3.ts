import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { getEnv } from './env';

const s3Client = new S3Client({
  region: getEnv('S3_REGION', 'garage'),
  endpoint: getEnv('S3_ENDPOINT', 'https://storage.chatwoot.space'),
  credentials: {
    accessKeyId: getEnv('S3_ACCESS_KEY_ID'),
    secretAccessKey: getEnv('S3_SECRET_ACCESS_KEY'),
  },
  forcePathStyle: true,
});

export async function uploadImage(buffer: Buffer, mimetype: string, originalName: string) {
  const extension = originalName.split('.').pop();
  const fileName = `${uuidv4()}.${extension}`;
  const bucket = getEnv('S3_BUCKET', 'files.chatwoot.space');

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: fileName,
    Body: buffer,
    ContentType: mimetype,
  });

  await s3Client.send(command);

  // Return public URL
  // Se o endpoint S3 é storage.chatwoot.space e bucket é files.chatwoot.space
  // E você ativou website, a URL pública pode ser diretamente pelo domínio do bucket se mapeado, ou via bucket endpoint
  return `https://files.chatwoot.space/${fileName}`;
}
