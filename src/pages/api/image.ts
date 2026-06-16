import type { APIRoute } from 'astro';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

export const prerender = false;

const CACHE_DIR = '/tmp/casa-dantas-image-cache';
const ALLOWED_HOSTS = new Set(['files.chatwoot.space']);
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 25000;

function clampNumber(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function validateSource(src: string | null) {
  if (!src) return null;

  try {
    const url = new URL(src);

    if (url.protocol !== 'https:') return null;
    if (!ALLOWED_HOSTS.has(url.hostname)) return null;
    if (!url.pathname.startsWith('/catalogo/')) return null;

    return url;
  } catch {
    return null;
  }
}

function responseHeaders(maxAge = 31536000) {
  return {
    'Content-Type': 'image/webp',
    'Cache-Control': `public, max-age=${maxAge}, immutable`,
    Vary: 'Accept',
    'X-Content-Type-Options': 'nosniff',
  };
}

async function getCachedImage(cacheKey: string) {
  try {
    return await readFile(join(CACHE_DIR, `${cacheKey}.webp`));
  } catch {
    return null;
  }
}

async function setCachedImage(cacheKey: string, data: Buffer) {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(join(CACHE_DIR, `${cacheKey}.webp`), data);
  } catch (error) {
    console.warn('Falha ao gravar cache de imagem otimizada:', error);
  }
}

export const GET: APIRoute = async ({ url }) => {
  const sourceUrl = validateSource(url.searchParams.get('src'));

  if (!sourceUrl) {
    return new Response('Imagem inválida.', { status: 400 });
  }

  const width = clampNumber(url.searchParams.get('w'), 640, 96, 1600);
  const quality = clampNumber(url.searchParams.get('q'), 74, 45, 90);
  const cacheKey = createHash('sha256')
    .update(`${sourceUrl.toString()}|w=${width}|q=${quality}|v=2`)
    .digest('hex');

  const cached = await getCachedImage(cacheKey);

  if (cached) {
    return new Response(new Uint8Array(cached), {
      status: 200,
      headers: {
        ...responseHeaders(),
        'X-Image-Cache': 'HIT',
      },
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const upstream = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CasaDantasImageOptimizer/1.0',
        Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
      },
    });

    if (!upstream.ok) {
      return new Response('Imagem não encontrada.', { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || '';
    const contentLength = Number(upstream.headers.get('content-length') || 0);

    if (!contentType.startsWith('image/') || contentLength > MAX_SOURCE_BYTES) {
      return new Response('Formato de imagem não suportado.', { status: 415 });
    }

    const sourceBuffer = Buffer.from(await upstream.arrayBuffer());

    if (sourceBuffer.byteLength > MAX_SOURCE_BYTES) {
      return new Response('Imagem muito grande.', { status: 413 });
    }

    const optimized = await sharp(sourceBuffer, { failOn: 'none' })
      .rotate()
      .resize({
        width,
        withoutEnlargement: true,
        fit: 'inside',
      })
      .webp({ quality, effort: 4 })
      .toBuffer();

    await setCachedImage(cacheKey, optimized);

    return new Response(new Uint8Array(optimized), {
      status: 200,
      headers: {
        ...responseHeaders(),
        'X-Image-Cache': 'MISS',
        'Server-Timing': `img;desc="optimized ${sourceBuffer.byteLength} to ${optimized.byteLength}"`,
      },
    });
  } catch (error) {
    console.error('Falha ao otimizar imagem do catálogo:', error);

    return new Response('Falha ao otimizar imagem.', { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
};
