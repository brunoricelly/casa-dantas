import { useMemo, useState } from 'react';
import { Search, ShoppingBag, SlidersHorizontal } from 'lucide-react';
import { categories } from '@/data/categories';

export type Product = {
  id: string;
  name: string;
  category: string;
  image: string;
  brand: string;
  sku: string;
  specs: string;
};

type Props = { products: Product[] };

export default function ProductCatalog({ products }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('todos');
  const [cart, setCart] = useState<Product[]>([]);

  const filtered = useMemo(() => products.filter((product) => {
    const text = `${product.name} ${product.brand} ${product.specs} ${product.sku}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (category === 'todos' || product.category === category);
  }), [products, query, category]);

  const addToCart = (product: Product) => setCart((items) => [...items, product]);
  
  const whatsAppText = encodeURIComponent(
    `Olá, Casa Dantas! Tenho interesse nestes produtos que vi no site:\n\n${cart.map((item, i) => `${i+1}. Ref: ${item.sku} - ${item.name}`).join('\n')}\n\nGostaria de mais informações!`
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28">
        <div className="flex items-center gap-2 text-dantas-navy"><SlidersHorizontal size={18}/><strong>Filtros inteligentes</strong></div>
        
        <label className="mt-5 block text-sm font-bold text-slate-700">Buscar</label>
        <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2">
          <Search size={18} className="text-slate-400"/>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tênis, bolsa, referência..." className="w-full bg-transparent text-sm outline-none" />
        </div>

        <label className="mt-5 block text-sm font-bold text-slate-700">Categoria</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-dantas-blue">
          <option value="todos">Todas as Categorias</option>
          {categories.map((cat) => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}
        </select>

        <div className="mt-6 rounded-3xl bg-blue-50 p-4">
          <div className="flex items-center gap-2 font-black text-dantas-blue"><ShoppingBag size={18}/> Minha Lista</div>
          <p className="mt-2 text-sm text-slate-600">{cart.length} item(ns) selecionados</p>
          {cart.length > 0 && <a className="mt-4 inline-flex w-full justify-center rounded-full bg-emerald-500 px-4 py-3 text-sm font-black text-white hover:bg-emerald-600" href={`https://wa.me/5588997085011?text=${whatsAppText}`} target="_blank" rel="noreferrer">Enviar para o WhatsApp</a>}
        </div>
      </aside>

      <section>
        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="font-bold text-slate-600">{filtered.length} produto(s) na vitrine</p>
        </div>
        
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <article key={product.id} className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
              
              <div className="relative grid aspect-[4/3] place-items-center bg-slate-100">
                {product.image && product.image !== '/placeholder.jpg' ? (
                  <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
                ) : (
                  <div className="text-center text-slate-400 text-sm font-medium">Sem Imagem</div>
                )}
              </div>

              <div className="p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-dantas-red">Ref: {product.sku}</p>
                <h3 className="mt-2 text-xl font-black text-dantas-navy">{product.name}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600 line-clamp-3">{product.specs}</p>
                
                <div className="mt-5 flex items-center justify-end">
                  <button onClick={() => addToCart(product)} className="rounded-full bg-dantas-blue px-4 py-3 text-sm font-black text-white transition hover:bg-dantas-navy">Adicionar à lista</button>
                </div>
              </div>

            </article>
          ))}
          {filtered.length === 0 && (
            <p className="text-slate-500 py-10">Nenhum produto encontrado com esses filtros.</p>
          )}
        </div>
      </section>
    </div>
  );
}