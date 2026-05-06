import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { products } from '../../../db/schema';
import { canManageCatalog, canManageProductScope, requireSession } from '../../../utils/auth';
import { uploadImage } from '../../../utils/s3';

async function getProduct(id: number) {
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return product;
}

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    const session = await requireSession(cookies);
    if (!canManageCatalog(session)) return new Response(JSON.stringify({ error: 'Sem permissão' }), { status: 403 });

    const id = Number(params.id);
    if (!id) return new Response(JSON.stringify({ error: 'ID inválido' }), { status: 400 });

    const current = await getProduct(id);
    if (!current) return new Response(JSON.stringify({ error: 'Produto não encontrado' }), { status: 404 });

    const formData = await request.formData();
    const codigo = formData.get('codigo')?.toString().trim() || '';
    const nome = formData.get('nome')?.toString().trim() || '';
    const especificacoes = formData.get('especificacoes')?.toString().trim() || '';
    const marca = formData.get('marca')?.toString().trim() || '';
    const categoria = formData.get('categoria')?.toString().trim() || '';
    const file = formData.get('imagem') as File | null;

    if (!canManageProductScope(session, marca, categoria)) {
      return new Response(JSON.stringify({ error: 'Você não tem permissão para esta marca/categoria.' }), { status: 403 });
    }

    let imagem_url = current.imagem_url;
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      imagem_url = await uploadImage(buffer, file.type, file.name);
    }

    const [updated] = await db.update(products).set({
      codigo,
      nome,
      especificacoes,
      marca: marca || null,
      categoria: categoria || null,
      imagem_url,
      updated_at: new Date(),
    }).where(eq(products.id, id)).returning();

    return new Response(JSON.stringify({ success: true, product: updated }), { status: 200 });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    const session = await requireSession(cookies);
    if (!canManageCatalog(session)) return new Response(JSON.stringify({ error: 'Sem permissão' }), { status: 403 });

    const id = Number(params.id);
    if (!id) return new Response(null, { status: 400 });

    const current = await getProduct(id);
    if (!current) return new Response(JSON.stringify({ error: 'Produto não encontrado' }), { status: 404 });
    if (!canManageProductScope(session, current.marca, current.categoria)) {
      return new Response(JSON.stringify({ error: 'Você não tem permissão para excluir este produto.' }), { status: 403 });
    }

    await db.delete(products).where(eq(products.id, id));
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
