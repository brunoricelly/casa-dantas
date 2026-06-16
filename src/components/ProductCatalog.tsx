import { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingBag, SlidersHorizontal, X } from 'lucide-react';
import { categories } from '@/data/categories';
import ProductImageCarousel from './ProductImageCarousel';

const WHATSAPP_NUMBER = '5588997085002';
const PAGE_SIZE = 24;

export type Product = {
  id: string;
  name: string;
  category: string;
  image: string;
  images?: string[];
  brand: string;
  sku: string;
  specs: string;
};

type CatalogResponse = {
  products: Product[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

type Props = {
  products?: Product[];
  initialCategory?: string;
};

function buildCatalogUrl({
  page,
  query,
  category,
}: {
  page: number;
  query: string;
  category: string;
}) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: PAGE_SIZE.toString(),
    q: query.trim(),
    category,
  });

  return `/api/catalogo?${params.toString()}`;
}

export default function ProductCatalog({ products: initialProducts = [], initialCategory = 'todos' }: Props) {
  const apiMode = initialProducts.length === 0;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [page, setPage] = useState(apiMode ? 0 : 1);
  const [total, setTotal] = useState(initialProducts.length);
  const [hasMore, setHasMore] = useState(apiMode);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const visibleProducts = useMemo(() => {
    if (apiMode) return products;

    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.brand.toLowerCase().includes(normalizedQuery) ||
        product.sku.toLowerCase().includes(normalizedQuery) ||
        product.specs.toLowerCase().includes(normalizedQuery);
      const matchesCategory = category === 'todos' || product.category === category;

      return matchesQuery && matchesCategory;
    });
  }, [apiMode, category, products, query]);

  const loadProducts = async ({
    nextPage,
    append,
    signal,
  }: {
    nextPage: number;
    append: boolean;
    signal?: AbortSignal;
  }) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const response = await fetch(buildCatalogUrl({ page: nextPage, query, category }), {
        signal,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Não foi possível carregar o catálogo agora.');
      }

      const data = (await response.json()) as CatalogResponse;

      setProducts((current) => (append ? [...current, ...data.products] : data.products));
      setPage(data.page);
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;

      console.error('Erro ao carregar catálogo:', err);
      setError('Não foi possível carregar os produtos. Tente novamente.');
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!apiMode) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      loadProducts({ nextPage: 1, append: false, signal: controller.signal });
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, category]);

  const addToCart = (product: Product) => {
    setCart((items) => [...items, product]);
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  useEffect(() => {
    if (!selectedProduct) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedProduct]);

  const whatsAppText = encodeURIComponent(
    [
      'Olá, Casa Dantas! Tenho interesse nestes produtos que vi no site:',
      '',
      ...cart.map((item, index) => `${index + 1}. Ref: ${item.sku} - ${item.name}`),
      '',
      'Gostaria de mais informações!',
    ].join('\n')
  );

  const selectedWhatsAppText = selectedProduct
    ? encodeURIComponent(
        [
          'Olá, Casa Dantas! Tenho interesse neste produto que vi no site:',
          '',
          `Ref: ${selectedProduct.sku}`,
          `Produto: ${selectedProduct.name}`,
          selectedProduct.brand ? `Marca: ${selectedProduct.brand}` : '',
          '',
          'Gostaria de mais informações!',
        ]
          .filter(Boolean)
          .join('\n')
      )
    : '';

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28">
          <div className="flex items-center gap-2 text-dantas-navy">
            <SlidersHorizontal size={18} />
            <strong>Filtros inteligentes</strong>
          </div>

          <label className="mt-5 block text-sm font-bold text-slate-700">
            Buscar
          </label>

          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2">
            <Search size={18} className="text-slate-400" />

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tênis, bolsa, referência..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <label className="mt-5 block text-sm font-bold text-slate-700">
            Categoria
          </label>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-dantas-blue"
          >
            <option value="todos">Todas as Categorias</option>

            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>

          <div className="mt-6 rounded-3xl bg-blue-50 p-4">
            <div className="flex items-center gap-2 font-black text-dantas-blue">
              <ShoppingBag size={18} />
              Minha Lista
            </div>

            <p className="mt-2 text-sm text-slate-600">
              {cart.length} item(ns) selecionados
            </p>

            {cart.length > 0 && (
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsAppText}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex w-full justify-center rounded-full bg-emerald-500 px-4 py-3 text-sm font-black text-white hover:bg-emerald-600"
              >
                Enviar para o WhatsApp
              </a>
            )}
          </div>
        </aside>

        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <p className="font-bold text-slate-600">
              {loading ? 'Carregando vitrine...' : `${total} produto(s) na vitrine`}
            </p>

            {products.length > 0 && (
              <p className="text-sm font-semibold text-slate-500">
                Exibindo {products.length} de {total}
              </p>
            )}
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {loading && products.length === 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-96 animate-pulse rounded-[2rem] border border-slate-200 bg-slate-100"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => (
                <article
                  key={product.id}
                  className="group rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
                >
                  <ProductImageCarousel
                    images={product.images}
                    fallbackImage={product.image}
                    alt={product.name}
                    clickable
                    onOpen={() => setSelectedProduct(product)}
                  />

                  <div className="p-2 pt-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-dantas-red">
                      Ref: {product.sku}
                    </p>

                    <h3 className="mt-2 text-xl font-black text-dantas-navy">
                      {product.name}
                    </h3>

                    <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600 line-clamp-3">
                      {product.specs}
                    </p>

                    <div className="mt-5 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="rounded-full bg-dantas-blue px-4 py-3 text-sm font-black text-white transition hover:bg-dantas-navy"
                      >
                        Adicionar à lista
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {!loading && visibleProducts.length === 0 && (
                <p className="py-10 text-slate-500">
                  Nenhum produto encontrado com esses filtros.
                </p>
              )}
            </div>
          )}

          {hasMore && products.length > 0 && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => loadProducts({ nextPage: page + 1, append: true })}
                disabled={loadingMore}
                className="rounded-full bg-dantas-navy px-6 py-3 text-sm font-black text-white transition hover:bg-dantas-blue disabled:cursor-wait disabled:opacity-60"
              >
                {loadingMore ? 'Carregando...' : 'Carregar mais produtos'}
              </button>
            </div>
          )}
        </section>
      </div>

      {selectedProduct && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
        >
          <div
            className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl sm:rounded-[2.5rem] lg:grid lg:grid-cols-[1.15fr_0.85fr]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              aria-label="Fechar"
              className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-slate-700 shadow-lg transition hover:scale-105 hover:bg-white"
            >
              <X size={22} />
            </button>

            <div className="max-h-[58vh] overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:max-h-[94vh]">
              <ProductImageCarousel
                images={selectedProduct.images}
                fallbackImage={selectedProduct.image}
                alt={selectedProduct.name}
                variant="modal"
              />
            </div>

            <div className="max-h-[36vh] overflow-y-auto p-6 sm:p-8 lg:max-h-[94vh]">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-dantas-red">
                Ref: {selectedProduct.sku}
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight text-dantas-navy sm:text-4xl">
                {selectedProduct.name}
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedProduct.brand && (
                  <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-dantas-blue">
                    {selectedProduct.brand}
                  </span>
                )}

                {selectedProduct.category && (
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600">
                    {selectedProduct.category}
                  </span>
                )}
              </div>

              <p className="mt-5 whitespace-pre-line text-base leading-8 text-slate-600">
                {selectedProduct.specs}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => addToCart(selectedProduct)}
                  className="rounded-full bg-dantas-blue px-5 py-3 text-sm font-black text-white transition hover:bg-dantas-navy"
                >
                  Adicionar à lista
                </button>

                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${selectedWhatsAppText}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-emerald-500 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-emerald-600"
                >
                  Consultar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
