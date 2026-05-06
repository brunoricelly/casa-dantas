import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { getAdminEmails, requireAdmin, requireSession } from '../../../utils/auth';

function toArray(value: unknown) {
  const raw = `${value || ''}`;
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    const session = await requireSession(cookies);
    requireAdmin(session);

    const id = Number(params.id);
    if (!id) return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });

    const body = await request.json();
    const role = body.role === 'administrador' ? 'administrador' : 'editor';
    const marcas = Array.isArray(body.marcas) ? body.marcas : toArray(body.marcas);
    const categorias = Array.isArray(body.categorias) ? body.categorias : toArray(body.categorias);

    const [updated] = await db.update(users).set({
      role,
      marcas,
      categorias,
      active: body.active !== false,
      updated_at: new Date(),
    }).where(eq(users.id, id)).returning();

    return new Response(JSON.stringify({ success: true, user: updated }), { status: 200 });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    const session = await requireSession(cookies);
    requireAdmin(session);

    const id = Number(params.id);
    if (!id) return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });

    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), { status: 404 });

    if (getAdminEmails().includes(user.email.toLowerCase())) {
      return new Response(JSON.stringify({ error: 'O administrador principal não pode ser removido.' }), { status: 400 });
    }

    await db.delete(users).where(eq(users.id, id));
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
