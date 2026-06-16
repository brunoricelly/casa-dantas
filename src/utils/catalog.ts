import { and, asc, count, desc, eq, ilike, inArray, or, type SQL } from 'drizzle-orm';
import { products as fallbackProducts } from '@/data/products';
import { db } from '../db';
import { productImages, products as schemaProducts } from '../db/schema';

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 48;

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

export type CatalogPage = {
  products: CatalogProduct[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

type CatalogQueryOptions = {
  page?: number;
  limit?: number;
  query?: string;
  category?: string;
};

function normalizePage(value?: number) {
  if (!Number.isFinite(value) || !value || value < 1) return 1;

  return Math.floor(value);
}

function normalizeLimit(value?: number) {
  if (!Number.isFinite(value) || !value) return DEFAULT_PAGE_SIZE;

  return Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(value)));
}

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

function buildCatalogWhere(options: CatalogQueryOptions = {}) {
  const filters: SQL[] = [eq(schemaProducts.visible, true)];
  const normalizedCategory = options.category?.trim();
  const normalizedQuery = options.query?.trim();

  if (normalizedCategory && normalizedCategory !== 'todos') {
    filters.push(eq(schemaProducts.categoria, normalizedCategory));
  }

  if (normalizedQuery) {
    const search = `%${normalizedQuery}%`;

    filters.push(
      or(
        ilike(schemaProducts.nome, search),
        ilike(schemaProducts.marca, search),
        ilike(schemaProducts.codigo, search),
        ilike(schemaProducts.especificacoes, search)
      )!
    );
  }

  return and(...filters)!;
}

function mapRowsWithImages(
  rows: (typeof schemaProducts.$inferSelect)[],
  imagesByProduct: Map<number, string[]>
): CatalogProduct[] {
  return rows.map((p) => {
    const images = [...(imagesByProduct.get(p.id) || [])];

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
}

async function getImagesByProduct(productIds: number[]) {
  const imagesByProduct = new Map<number, string[]>();

  if (productIds.length === 0) return imagesByProduct;

  const imageRows = await db
    .select()
    .from(productImages)
    .where(inArray(productImages.product_id, productIds))
    .orderBy(asc(productImages.product_id), asc(productImages.sort_order));

  for (const img of imageRows) {
    const currentImages = imagesByProduct.get(img.product_id) || [];

    if (!currentImages.includes(img.imagem_url)) {
      currentImages.push(img.imagem_url);
    }

    imagesByProduct.set(img.product_id, currentImages);
  }

  return imagesByProduct;
}

export async function getCatalogProducts(limit?: number): Promise<CatalogProduct[]> {
  try {
    const query = db
      .select()
      .from(schemaProducts)
      .where(eq(schemaProducts.visible, true))
      .orderBy(desc(schemaProducts.created_at));

    const rows = typeof limit === 'number' ? await query.limit(limit) : await query;
    const imagesByProduct = await getImagesByProduct(rows.map((product) => product.id));

    // Em produção, a vitrine pública precisa refletir exatamente o banco.
    // Produtos demonstrativos só devem aparecer se o banco estiver indisponível,
    // não quando o banco está funcionando mas ainda não há produtos cadastrados.
    return mapRowsWithImages(rows, imagesByProduct);
  } catch (error) {
    console.error('Falha ao carregar produtos do banco. Usando vitrine demonstrativa.', error);

    return fallbackCatalog(limit);
  }
}

export async function getCatalogPage(options: CatalogQueryOptions = {}): Promise<CatalogPage> {
  const page = normalizePage(options.page);
  const limit = normalizeLimit(options.limit);
  const offset = (page - 1) * limit;
  const where = buildCatalogWhere(options);

  try {
    const [totalRow] = await db
      .select({ value: count() })
      .from(schemaProducts)
      .where(where);

    const total = Number(totalRow?.value || 0);
    const rows = await db
      .select()
      .from(schemaProducts)
      .where(where)
      .orderBy(desc(schemaProducts.created_at))
      .limit(limit)
      .offset(offset);

    const imagesByProduct = await getImagesByProduct(rows.map((product) => product.id));
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      products: mapRowsWithImages(rows, imagesByProduct),
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    };
  } catch (error) {
    console.error('Falha ao carregar página do catálogo. Usando vitrine demonstrativa.', error);

    const products = fallbackCatalog(limit);

    return {
      products,
      page: 1,
      limit,
      total: products.length,
      totalPages: 1,
      hasMore: false,
    };
  }
}
