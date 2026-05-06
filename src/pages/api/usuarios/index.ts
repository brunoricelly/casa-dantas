import type { APIRoute } from 'astro';
import { asc } from 'drizzle-orm';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { requireAdmin, requireSession } from '../../../utils/auth';

function toArray(value: unknown) {
  const raw = `${value || ''}`;
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const session = await requireSession(cookies);
    requireAdmin(session);
    const lista = await db.select().from(users).orderBy(asc(users.email));
    return new Response(JSON.stringify(lista), { status: 200 });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = await requireSession(cookies);
    requireAdmin(session);

    const body = await request.json();
    const email = `${body.email || ''}`.trim().toLowerCase();
    const role = body.role === 'administrador' ? 'administrador' : 'editor';
    const marcas = Array.isArray(body.marcas) ? body.marcas : toArray(body.marcas);
    const categorias = Array.isArray(body.categorias) ? body.categorias : toArray(body.categorias);

    if (!email) return new Response(JSON.stringify({ error: 'E-mail obrigatório' }), { status: 400 });

    const [saved] = await db.insert(users).values({
      email,
      role,
      marcas,
      categorias,
      active: body.active !== false,
      updated_at: new Date(),
    }).onConflictDoUpdate({
      target: users.email,
      set: { role, marcas, categorias, active: body.active !== false, updated_at: new Date() }
    }).returning();

    return new Response(JSON.stringify({ success: true, user: saved }), { status: 200 });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
