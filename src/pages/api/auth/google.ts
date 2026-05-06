import type { APIRoute } from 'astro';
import { getSiteUrl } from '../../../utils/auth';
import { getEnv, isProduction } from '../../../utils/env';

export const GET: APIRoute = async ({ cookies, url }) => {
  const clientId = getEnv('GOOGLE_CLIENT_ID');
  if (!clientId) {
    return new Response('GOOGLE_CLIENT_ID não configurado no Coolify.', { status: 500 });
  }

  const state = crypto.randomUUID();
  cookies.set('oauth_state', state, {
    path: '/',
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    maxAge: 60 * 10,
  });

  const siteUrl = getSiteUrl(url.origin);
  const redirectUri = getEnv('GOOGLE_REDIRECT_URI') || `${siteUrl}/api/auth/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state,
  });

  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, 302);
};
