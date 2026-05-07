import type { APIRoute } from 'astro';
import { Buffer } from 'node:buffer';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { productImages, products } from '../../../db/schema';
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

async function getProduct(id: number) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  return product;
}

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    const session = await requireSession(cookies);

    if (!canManageCatalog(session)) {
      return json({ error: 'Sem permissão' }, 403);
    }

    const id = Number(params.id);

    if (!id) {
      return json({ error: 'ID inválido' }, 400);
    }

    const current = await getProduct(id);

    if (!current) {
      return json({ error: 'Produto não encontrado' }, 404);
    }

    const formData = await request.formData();

    const codigo = formData.get('codigo')?.toString().trim() || '';
    const nome = formData.get('nome')?.toString().trim() || '';
    const especificacoes = formData.get('especificacoes')?.toString().trim() || '';
    const marca = formData.get('marca')?.toString().trim() || '';
    const categoria = formData.get('categoria')?.toString().trim() || '';

    const multiFiles = formData
      .getAll('imagens')
      .filter((item): item is File => item instanceof File && item.size > 0);

    const singleFile = formData.get('imagem');

    const files =
      multiFiles.length > 0
        ? multiFiles
        : singleFile instanceof File && singleFile.size > 0
          ? [singleFile]
          : [];

    if (!codigo || !nome || !especificacoes) {
      return json({ error: 'Código, nome e especificações são obrigatórios.' }, 400);
    }

    if (!canManageProductScope(session, marca, categoria)) {
      return json({ error: 'Você não tem permissão para esta marca/categoria.' }, 403);
    }

    let imagem_url = current.imagem_url;
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const url = await uploadImage(buffer, file.type, file.name);

      uploadedUrls.push(url);
    }

    if (!imagem_url && uploadedUrls.length > 0) {
      imagem_url = uploadedUrls[0];
    }

    const [updated] = await db
      .update(products)
      .set({
        codigo,
        nome,
        especificacoes,
        marca: marca || null,
        categoria: categoria || null,
        imagem_url,
        updated_at: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (uploadedUrls.length > 0) {
      await db.insert(productImages).values(
        uploadedUrls.map((url, index) => ({
          product_id: id,
          imagem_url: url,
          sort_order: index,
        }))
      );
    }

    return json({
      success: true,
      product: updated,
    });
  } catch (e: any) {
    if (e instanceof Response) return e;

    console.error('Erro ao atualizar produto:', e);

    return json(
      {
        error: e?.message || 'Erro interno ao atualizar produto.',
      },
      500
    );
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    const session = await requireSession(cookies);

    if (!canManageCatalog(session)) {
      return json({ error: 'Sem permissão' }, 403);
    }

    const id = Number(params.id);

    if (!id) {
      return json({ error: 'ID inválido' }, 400);
    }

    const current = await getProduct(id);

    if (!current) {
      return json({ error: 'Produto não encontrado' }, 404);
    }

    if (!canManageProductScope(session, current.marca, current.categoria)) {
      return json({ error: 'Você não tem permissão para excluir este produto.' }, 403);
    }

    await db.delete(products).where(eq(products.id, id));

    return json({
      success: true,
    });
  } catch (e: any) {
    if (e instanceof Response) return e;

    console.error('Erro ao excluir produto:', e);

    return json(
      {
        error: e?.message || 'Erro interno ao excluir produto.',
      },
      500
    );
  }
};
