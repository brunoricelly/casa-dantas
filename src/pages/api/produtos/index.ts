import type { APIRoute } from 'astro';
import { Buffer } from 'node:buffer';
import { desc } from 'drizzle-orm';
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

    const contentType = request.headers.get('content-type') || '';

    let codigo = '';
    let nome = '';
    let especificacoes = '';
    let marca = '';
    let categoria = '';
    let imagem_url = '';
    let visible = true;
    let files: File[] = [];

    if (contentType.includes('application/json')) {
      const body = await request.json();

      codigo = body.codigo?.toString().trim() || '';
      nome = body.nome?.toString().trim() || '';
      especificacoes = body.especificacoes?.toString().trim() || '';
      marca = body.marca?.toString().trim() || '';
      categoria = body.categoria?.toString().trim() || '';
      imagem_url = body.imagem_url?.toString().trim() || '';
      visible = body.visible !== false;
    } else {
      const formData = await request.formData();

      codigo = formData.get('codigo')?.toString().trim() || '';
      nome = formData.get('nome')?.toString().trim() || '';
      especificacoes = formData.get('especificacoes')?.toString().trim() || '';
      marca = formData.get('marca')?.toString().trim() || '';
      categoria = formData.get('categoria')?.toString().trim() || '';
      imagem_url = formData.get('imagem_url')?.toString().trim() || '';
      visible = formData.has('visible');

      const multiFiles = formData
        .getAll('imagens')
        .filter((item): item is File => item instanceof File && item.size > 0);

      const singleFile = formData.get('imagem');

      files = multiFiles;

      if (singleFile instanceof File && singleFile.size > 0 && files.length === 0) {
        files = [singleFile];
      }
    }

    if (!codigo || !nome || !especificacoes) {
      return json({ error: 'Código, nome e especificações são obrigatórios.' }, 400);
    }

    if (!canManageProductScope(session, marca, categoria)) {
      return json({ error: 'Você não tem permissão para esta marca/categoria.' }, 403);
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const url = await uploadImage(buffer, file.type, file.name);

      uploadedUrls.push(url);
    }

    if (!imagem_url && uploadedUrls.length > 0) {
      imagem_url = uploadedUrls[0];
    }

    const [created] = await db
      .insert(products)
      .values({
        codigo,
        nome,
        especificacoes,
        marca: marca || null,
        categoria: categoria || null,
        imagem_url,
        visible,
        updated_at: new Date(),
      })
      .returning();

    if (uploadedUrls.length > 0) {
      await db.insert(productImages).values(
        uploadedUrls.map((url, index) => ({
          product_id: created.id,
          imagem_url: url,
          sort_order: index,
        }))
      );
    }

    return json({
      success: true,
      product: created,
    });
  } catch (e: any) {
    if (e instanceof Response) return e;

    console.error('Erro ao salvar produto:', e);

    return json(
      {
        error: e?.message || 'Erro interno ao salvar produto.',
      },
      500
    );
  }
};
