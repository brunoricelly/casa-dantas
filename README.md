# Casa Dantas Quixadá

Site moderno da Casa Dantas, tradicional loja de calçados, bolsas, malas e acessórios em Quixadá-CE.

## Stack

- Astro 5
- React Islands
- TypeScript
- Tailwind CSS
- SEO + sitemap
- Docker/Coolify para deploy
- PostgreSQL + storage S3 compatível (Cloudflare R2 em produção)

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

Produção planejada:

- Domínio: https://casadantas.chatwoot.space
- Branch: `main`
- Coolify: Dockerfile

## Roadmap

- Integração com PostgreSQL para leads/pedidos
- Integração Cloudflare R2/S3 compatível para imagens dos produtos
- Checkout PIX/cartão via gateway brasileiro
- Área do cliente e painel administrativo
