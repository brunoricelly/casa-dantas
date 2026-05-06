import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { products } from '../../../db/schema';
import { uploadImage } from '../../../utils/s3';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const codigo = formData.get('codigo')?.toString() || '';
    const nome = formData.get('nome')?.toString() || '';
    const especificacoes = formData.get('especificacoes')?.toString() || '';
    const file = formData.get('imagem') as File;

    let imagem_url = null;

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      imagem_url = await uploadImage(buffer, file.type, file.name);
    }

    await db.insert(products).values({
      codigo,
      nome,
      especificacoes,
      imagem_url,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
