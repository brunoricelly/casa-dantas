type EnvKey =
  | 'DATABASE_URL'
  | 'JWT_SECRET'
  | 'PUBLIC_SITE_URL'
  | 'SITE_URL'
  | 'ADMIN_EMAILS'
  | 'ADMIN_EMAIL'
  | 'ADMIN_PASSWORD'
  | 'GOOGLE_CLIENT_ID'
  | 'GOOGLE_CLIENT_SECRET'
  | 'GOOGLE_REDIRECT_URI'
  | 'S3_REGION'
  | 'S3_ENDPOINT'
  | 'S3_PUBLIC_URL'
  | 'S3_ACCESS_KEY_ID'
  | 'S3_SECRET_ACCESS_KEY'
  | 'S3_BUCKET';

function runtimeEnv(): Record<string, string | undefined> {
  // Eval keeps Vite/Astro from statically replacing process.env.KEY with an
  // empty build-time value. We need Docker runtime envs in production.
  try {
    return (globalThis as any).process?.env || (0, eval)('process.env') || {};
  } catch {
    return {};
  }
}

export function getEnv(key: EnvKey, fallback = '') {
  const runtimeValue = runtimeEnv()[key];
  const buildValue = (import.meta as any).env?.[key];
  const value = runtimeValue || buildValue || fallback;
  return typeof value === 'string' ? value.trim() : value;
}

export function isProduction() {
  const nodeEnv = runtimeEnv().NODE_ENV;
  return nodeEnv === 'production' || Boolean((import.meta as any).env?.PROD);
}
