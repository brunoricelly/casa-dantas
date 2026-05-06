import type { APIRoute } from 'astro';
import { desc } from 'drizzle-orm';
import { db } from '../../../db';
import { products } from '../../../db/schema';
import { canManageCatalog, canManageProductScope, requireSession } from '../../../utils/auth';
import { uploadImage } from '../../../utils/s3';

export const GET: APIRoute = async () => {
  const lista = await db.select().from(products).orderBy(desc(products.created_at));
  return new Response(JSON.stringify(lista), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = await requireSession(cookies);
    if (!canManageCatalog(session)) {
      return new Response(JSON.stringify({ error: 'Sem permissão para gerenciar produtos' }), { status: 403 });
    }

    const formData = await request.formData();
    const codigo = formData.get('codigo')?.toString().trim() || '';
    const nome = formData.get('nome')?.toString().trim() || '';
    const especificacoes = formData.get('especificacoes')?.toString().trim() || '';
    const marca = formData.get('marca')?.toString().trim() || '';
    const categoria = formData.get('categoria')?.toString().trim() || '';
    const file = formData.get('imagem') as File | null;

    if (!codigo || !nome || !especificacoes) {
      return new Response(JSON.stringify({ error: 'Código, nome e especificações são obrigatórios.' }), { status: 400 });
    }

    if (!canManageProductScope(session, marca, categoria)) {
      return new Response(JSON.stringify({ error: 'Você não tem permissão para esta marca/categoria.' }), { status: 403 });
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

    return new Response(JSON.stringify({ success: true, product: created }), { status: 200 });
  } catch (e: any) {
    if (e instanceof Response) return e;
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
