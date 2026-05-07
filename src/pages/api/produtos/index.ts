import type { APIRoute } from 'astro';
import { desc } from 'drizzle-orm';
import { db } from '../../../db';
import { products } from '../../../db/schema';
import { canManageCatalog, canManageProductScope, requireSession } from '../../../utils/auth';
import { uploadImage } from '../../../utils/s3';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export const GET: APIRoute = async () => {
  const lista = await db.select().from(products).orderBy(desc(products.created_at));
  return json(lista);
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = await requireSession(cookies);
    if (!canManageCatalog(session)) {
      return json({ error: 'Sem permissão para gerenciar produtos' }, 403);
    }

    const formData = await request.formData();
    const codigo = formData.get('codigo')?.toString().trim() || '';
    const nome = formData.get('nome')?.toString().trim() || '';
    const especificacoes = formData.get('especificacoes')?.toString().trim() || '';
    const marca = formData.get('marca')?.toString().trim() || '';
    const categoria = formData.get('categoria')?.toString().trim() || '';
    const file = formData.get('imagem') as File | null;

    if (!codigo || !nome || !especificacoes) {
      return json({ error: 'Código, nome e especificações são obrigatórios.' }, 400);
    }

    if (!canManageProductScope(session, marca, categoria)) {
      return json({ error: 'Você não tem permissão para esta marca/categoria.' }, 403);
    }

    let imagem_url: string | null = null;
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      imagem_url = await uploadImage(buffer, file.type, file.name);
    }

    const [created] = await db.insert(products).values({
      codigo,
      nome,
      especificacoes,
      marca: marca || null,
      categoria: categoria || null,
      imagem_url,
      updated_at: new Date(),
    }).returning();

    return json({ success: true, product: created });
  } catch (e: any) {
    if (e instanceof Response) return e;
    console.error('Erro ao salvar produto:', e);
    return json({ error: e?.message || 'Erro interno ao salvar produto.' }, 500);
  }
};
