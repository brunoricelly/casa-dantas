import { useMemo, useState } from 'react';
import { Search, ShoppingBag, SlidersHorizontal } from 'lucide-react';
import type { Product } from '@/data/products';
import { brands } from '@/data/products';
import { categories } from '@/data/categories';

type Props = { products: Product[] };
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function getInitialCategory() {
  if (typeof window === 'undefined') return 'todos';
  return new URLSearchParams(window.location.search).get('categoria') || 'todos';
}

export default function ProductCatalog({ products }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(getInitialCategory);
  const [brand, setBrand] = useState('todas');
  const [cart, setCart] = useState<Product[]>([]);

  const filtered = useMemo(() => products.filter((product) => {
    const text = `${product.name} ${product.brand} ${product.description}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (category === 'todos' || product.category === category) && (brand === 'todas' || product.brand === brand);
  }), [products, query, category, brand]);

  const addToCart = (product: Product) => setCart((items) => [...items, product]);
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  const whatsAppText = encodeURIComponent(`Olá, Casa Dantas! Tenho interesse nestes produtos:\n${cart.map((item, i) => `${i+1}. ${item.name} - ${currency.format(item.price)}`).join('\n')}\nTotal estimado: ${currency.format(total)}`);

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28">
        <div className="flex items-center gap-2 text-dantas-navy"><SlidersHorizontal size={18}/><strong>Filtros inteligentes</strong></div>
        <label className="mt-5 block text-sm font-bold text-slate-700">Buscar</label>
        <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2">
          <Search size={18} className="text-slate-400"/>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tênis, bolsa, Vizzano..." className="w-full bg-transparent text-sm outline-none" />
        </div>
        <label className="mt-5 block text-sm font-bold text-slate-700">Categoria</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-dantas-blue">
          <option value="todos">Todas</option>
          {categories.map((cat) => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}
        </select>
        <label className="mt-5 block text-sm font-bold text-slate-700">Marca</label>
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-dantas-blue">
          <option value="todas">Todas</option>
          {brands.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <div className="mt-6 rounded-3xl bg-blue-50 p-4">
          <div className="flex items-center gap-2 font-black text-dantas-blue"><ShoppingBag size={18}/> Carrinho</div>
          <p className="mt-2 text-sm text-slate-600">{cart.length} item(ns) · {currency.format(total)}</p>
          {cart.length > 0 && <a className="mt-4 inline-flex w-full justify-center rounded-full bg-emerald-500 px-4 py-3 text-sm font-black text-white hover:bg-emerald-600" href={`https://wa.me/5588997085011?text=${whatsAppText}`} target="_blank" rel="noreferrer">Finalizar no WhatsApp</a>}
        </div>
      </aside>
      <section>
        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="font-bold text-slate-600">{filtered.length} produto(s) encontrados</p>
          <p className="hidden text-sm text-slate-500 sm:block">MVP com checkout assistido; pagamento online entra na próxima fase.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <article key={product.id} className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
              <div className={`relative grid aspect-[4/3] place-items-center bg-gradient-to-br ${product.gradient}`}>
                {product.badge && <span className="absolute left-4 top-4 rounded-full bg-dantas-red px-3 py-1 text-xs font-black text-white">{product.badge}</span>}
                <div className="text-center">
                  <div className="text-6xl">{product.category === 'bolsas' ? '👜' : product.category === 'malas' ? '🧳' : product.category === 'infantil' ? '👟' : product.category === 'acessorios' ? '🧢' : product.category === 'escolar' ? '🎒' : product.category === 'masculino' ? '👞' : '👠'}</div>
                  <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-dantas-blue">Imagem via Garage S3 em breve</p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-dantas-red">{product.brand}</p>
                <h3 className="mt-2 text-xl font-black text-dantas-navy">{product.name}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{product.description}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                  {product.sizes.slice(0, 6).map((size) => <span key={size} className="rounded-full bg-slate-100 px-2 py-1">{size}</span>)}
                </div>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <div>
                    {product.oldPrice && <p className="text-sm font-semibold text-slate-400 line-through">{currency.format(product.oldPrice)}</p>}
                    <p className="text-2xl font-black text-dantas-blue">{currency.format(product.price)}</p>
                  </div>
                  <button onClick={() => addToCart(product)} className="rounded-full bg-dantas-blue px-4 py-3 text-sm font-black text-white transition hover:bg-dantas-navy">Adicionar</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
