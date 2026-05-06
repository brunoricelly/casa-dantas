import type { APIRoute } from 'astro';

export const POST: APIRoute = async () => {
  return new Response(JSON.stringify({
    error: 'Login por usuário/senha foi desativado. Use o botão Entrar com Google OAuth 2.0.'
  }), { status: 410 });
};
