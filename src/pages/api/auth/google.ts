import type { APIRoute } from 'astro';
import { randomBytes } from 'node:crypto';
import { getEnv, isProduction } from '../../../utils/env';

export const GET: APIRoute = async ({ cookies }) => {
  const clientId = getEnv('GOOGLE_CLIENT_ID');
  const redirectUri = getEnv('GOOGLE_REDIRECT_URI');

  if (!clientId || !redirectUri) {
    return new Response('Google OAuth não configurado.', { status: 500 });
  }

  const state = randomBytes(32).toString('hex');

  cookies.set('oauth_state', state, {
    path: '/',
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    maxAge: 60 * 10,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    },
  });
};
