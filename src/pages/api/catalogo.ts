import type { APIRoute } from 'astro';
import { getCatalogPage } from '../../utils/catalog';

export const prerender = false;

function numberParam(value: string | null, fallback: number) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export const GET: APIRoute = async ({ url }) => {
  const page = numberParam(url.searchParams.get('page'), 1);
  const limit = numberParam(url.searchParams.get('limit'), 24);
  const query = url.searchParams.get('q') || '';
  const category = url.searchParams.get('category') || 'todos';

  const result = await getCatalogPage({ page, limit, query, category });

  return json(result);
};
