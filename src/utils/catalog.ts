import { desc } from 'drizzle-orm';
import { products as fallbackProducts } from '@/data/products';
import { db } from '../db';
import { products as schemaProducts } from '../db/schema';

export type CatalogProduct = {
  id: string;
  name: string;
  category: string;
  image: string;
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
    brand: p.brand,
    sku: p.id,
    specs: p.description,
    gradient: p.gradient,
  }));

  return typeof limit === 'number' ? list.slice(0, limit) : list;
}

export async function getCatalogProducts(limit?: number): Promise<CatalogProduct[]> {
  try {
    const query = db.select().from(schemaProducts).orderBy(desc(schemaProducts.created_at));
    const rows = typeof limit === 'number' ? await query.limit(limit) : await query;

    // Em produção, a vitrine pública precisa refletir exatamente o banco.
    // Produtos demonstrativos só devem aparecer se o banco estiver indisponível,
    // não quando o banco está funcionando mas ainda não há produtos cadastrados.
    return rows.map((p) => ({
      id: p.id.toString(),
      name: p.nome,
      category: p.categoria || 'Catálogo',
      image: p.imagem_url || '/placeholder.jpg',
      brand: p.marca || 'Casa Dantas',
      sku: p.codigo,
      specs: p.especificacoes,
    }));
  } catch (error) {
    console.error('Falha ao carregar produtos do banco. Usando vitrine demonstrativa.', error);
    return fallbackCatalog(limit);
  }
}
