import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { products } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = Number(params.id);
    if (!id) return new Response(null, { status: 400 });

    await db.delete(products).where(eq(products.id, id));
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
