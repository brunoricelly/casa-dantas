export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice?: number;
  sizes: string[];
  colors: string[];
  badge?: string;
  description: string;
  gradient: string;
};

export const brands = ['Hanna Maitê', 'Mississipi', 'Chenson', 'Quiz', 'Vizzano', 'Usaflex', 'Vivaice', 'Jamar', 'Olympikus', 'Molekinha'];

export const products: Product[] = [
  { id: 'sandalia-vizzano-azul', name: 'Sandália Vizzano Elegance', brand: 'Vizzano', category: 'feminino', price: 159.9, oldPrice: 189.9, sizes: ['34','35','36','37','38','39'], colors: ['Azul','Nude','Preto'], badge: 'Mais vendido', description: 'Design elegante para eventos, trabalho e momentos especiais.', gradient: 'from-rose-100 via-white to-blue-100' },
  { id: 'tenis-olympikus-run', name: 'Tênis Olympikus Run Daily', brand: 'Olympikus', category: 'esportivo', price: 249.9, sizes: ['38','39','40','41','42','43'], colors: ['Preto','Branco','Azul'], badge: 'Performance', description: 'Conforto para caminhadas, treinos leves e rotina urbana.', gradient: 'from-emerald-100 via-white to-sky-100' },
  { id: 'bolsa-chenson-classic', name: 'Bolsa Chenson Classic', brand: 'Chenson', category: 'bolsas', price: 229.9, sizes: ['Único'], colors: ['Caramelo','Preto','Vermelho'], badge: 'Premium', description: 'Acabamento sofisticado e espaço interno funcional.', gradient: 'from-purple-100 via-white to-rose-100' },
  { id: 'sapato-usaflex-comfort', name: 'Sapato Usaflex Comfort', brand: 'Usaflex', category: 'feminino', price: 299.9, sizes: ['34','35','36','37','38','39'], colors: ['Preto','Nude'], badge: 'Conforto', description: 'Tecnologia de conforto para quem passa o dia em movimento.', gradient: 'from-blue-100 via-white to-amber-100' },
  { id: 'sapatenis-jamar-urban', name: 'Sapatênis Jamar Urban', brand: 'Jamar', category: 'masculino', price: 199.9, sizes: ['38','39','40','41','42','43'], colors: ['Marrom','Preto'], description: 'Versátil para combinar com jeans, alfaiataria leve e looks casuais.', gradient: 'from-slate-100 via-white to-blue-100' },
  { id: 'mala-vivaice-360', name: 'Mala Vivaice 360°', brand: 'Vivaice', category: 'malas', price: 349.9, sizes: ['P','M','G'], colors: ['Azul','Preto','Vermelho'], badge: 'Viagem', description: 'Rodas 360°, estrutura resistente e organização inteligente.', gradient: 'from-sky-100 via-white to-indigo-100' },
  { id: 'sandalia-mississipi-summer', name: 'Sandália Mississipi Summer', brand: 'Mississipi', category: 'feminino', price: 129.9, sizes: ['34','35','36','37','38','39'], colors: ['Dourado','Branco','Rosa'], description: 'Leve, moderna e perfeita para o clima do Ceará.', gradient: 'from-yellow-100 via-white to-rose-100' },
  { id: 'tenis-infantil-molekinha', name: 'Tênis Infantil Molekinha Play', brand: 'Molekinha', category: 'infantil', price: 119.9, sizes: ['22','23','24','25','26','27','28','29','30'], colors: ['Rosa','Azul','Branco'], badge: 'Infantil', description: 'Confortável, divertido e resistente para o dia a dia das crianças.', gradient: 'from-orange-100 via-white to-pink-100' },
  { id: 'mochila-escolar-premium', name: 'Mochila Escolar Premium', brand: 'Vivaice', category: 'escolar', price: 179.9, sizes: ['Único'], colors: ['Azul','Preto','Lilás'], description: 'Compartimentos funcionais e conforto para a rotina escolar.', gradient: 'from-blue-100 via-white to-red-100' },
  { id: 'cinto-masculino-classico', name: 'Cinto Masculino Clássico', brand: 'Jamar', category: 'acessorios', price: 69.9, sizes: ['P','M','G','GG'], colors: ['Preto','Marrom'], description: 'Acabamento refinado para compor looks casuais e sociais.', gradient: 'from-stone-100 via-white to-slate-100' },
  { id: 'tamanco-quiz-fashion', name: 'Tamanco Quiz Fashion', brand: 'Quiz', category: 'feminino', price: 169.9, sizes: ['34','35','36','37','38','39'], colors: ['Nude','Preto'], badge: 'Tendência', description: 'Visual moderno com presença e conforto.', gradient: 'from-red-100 via-white to-amber-100' },
  { id: 'rasteira-hanna-maite', name: 'Rasteira Hanna Maitê', brand: 'Hanna Maitê', category: 'feminino', price: 99.9, sizes: ['34','35','36','37','38','39'], colors: ['Dourado','Prata','Preto'], description: 'Praticidade e estilo para todos os dias.', gradient: 'from-amber-100 via-white to-blue-100' }
];
