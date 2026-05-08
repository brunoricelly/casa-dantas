import { asc, desc, eq, inArray } from 'drizzle-orm';
import { products as fallbackProducts } from '@/data/products';
import { db } from '../db';
import { productImages, products as schemaProducts } from '../db/schema';

export type CatalogProduct = {
  id: string;
  name: string;
  category: string;
  image: string;
  images?: string[];
  brand: string;
  sku: string;
  specs: string;
  gradient?: string;
};

function fallbackCatalog(limit?: number): CatalogProduct[] {
  const list = fallbackProducts.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    image: '/placeholder.jpg',
    images: ['/placeholder.jpg'],
    brand: p.brand,
    sku: p.id,
    specs: p.description,
    gradient: p.gradient,
  }));

  return typeof limit === 'number' ? list.slice(0, limit) : list;
}

export async function getCatalogProducts(limit?: number): Promise<CatalogProduct[]> {
  try {
    const query = db
      .select()
      .from(schemaProducts)
      .where(eq(schemaProducts.visible, true))
      .orderBy(desc(schemaProducts.created_at));

    const rows = typeof limit === 'number' ? await query.limit(limit) : await query;

    if (rows.length === 0) {
      return [];
    }

    const productIds = rows.map((product) => product.id);

    const imageRows = await db
      .select()
      .from(productImages)
      .where(inArray(productImages.product_id, productIds))
      .orderBy(asc(productImages.product_id), asc(productImages.sort_order));

    const imagesByProduct = new Map<number, string[]>();

    for (const img of imageRows) {
      const currentImages = imagesByProduct.get(img.product_id) || [];

      if (!currentImages.includes(img.imagem_url)) {
        currentImages.push(img.imagem_url);
      }

      imagesByProduct.set(img.product_id, currentImages);
    }

    // Em produção, a vitrine pública precisa refletir exatamente o banco.
    // Produtos demonstrativos só devem aparecer se o banco estiver indisponível,
    // não quando o banco está funcionando mas ainda não há produtos cadastrados.
    return rows.map((p) => {
      const images = imagesByProduct.get(p.id) || [];

      if (p.imagem_url && !images.includes(p.imagem_url)) {
        images.unshift(p.imagem_url);
      }

      return {
        id: p.id.toString(),
        name: p.nome,
        category: p.categoria || 'Catálogo',
        image: images[0] || '/placeholder.jpg',
        images: images.length > 0 ? images : ['/placeholder.jpg'],
        brand: p.marca || 'Casa Dantas',
        sku: p.codigo,
        specs: p.especificacoes,
      };
    });
  } catch (error) {
    console.error('Falha ao carregar produtos do banco. Usando vitrine demonstrativa.', error);

    return fallbackCatalog(limit);
  }
}
