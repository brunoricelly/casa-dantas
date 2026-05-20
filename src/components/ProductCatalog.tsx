import { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingBag, SlidersHorizontal, X } from 'lucide-react';
import { categories } from '@/data/categories';
import ProductImageCarousel from './ProductImageCarousel';
const WHATSAPP_NUMBER = '5588997085002';
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

type Props = {
  products: Product[];
  initialCategory?: string;
};

export default function ProductCatalog({ products, initialCategory = 'todos' }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [cart, setCart] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    return products.filter((product) => {
      const text = `${product.name} ${product.brand} ${product.specs} ${product.sku}`.toLowerCase();
      const matchesSearch = text.includes(normalizedQuery);
      const matchesCategory = category === 'todos' || product.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [products, query, category]);

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
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="font-bold text-slate-600">
              {filtered.length} produto(s) na vitrine
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product) => (
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

            {filtered.length === 0 && (
              <p className="py-10 text-slate-500">
                Nenhum produto encontrado com esses filtros.
              </p>
            )}
          </div>
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

              <p className="mt-6 whitespace-pre-line text-base leading-8 text-slate-700">
                {selectedProduct.specs}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => addToCart(selectedProduct)}
                  className="rounded-full bg-dantas-blue px-6 py-4 text-sm font-black text-white transition hover:bg-dantas-navy"
                >
                  Adicionar à lista
                </button>

                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${selectedWhatsAppText}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-emerald-500 px-6 py-4 text-center text-sm font-black text-white transition hover:bg-emerald-600"
                >
                  Chamar no WhatsApp
                </a>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="mt-4 w-full rounded-full border border-slate-200 px-6 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                Voltar para vitrine
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
