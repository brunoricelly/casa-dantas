import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { createToken, getAdminEmails, getSiteUrl, setAdminCookie } from '../../../utils/auth';

type GoogleUser = {
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

export const GET: APIRoute = async ({ cookies, redirect, url }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const savedState = cookies.get('oauth_state')?.value;

  if (!code || !state || !savedState || state !== savedState) {
    return new Response('Fluxo OAuth inválido. Tente novamente.', { status: 400 });
  }

  const clientId = import.meta.env.GOOGLE_CLIENT_ID;
  const clientSecret = import.meta.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new Response('GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET não configurados.', { status: 500 });
  }

  const siteUrl = getSiteUrl(url.origin);
  const redirectUri = import.meta.env.GOOGLE_REDIRECT_URI || `${siteUrl}/api/auth/callback`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    const detail = await tokenResponse.text();
    return new Response(`Erro ao validar login Google: ${detail}`, { status: 401 });
  }

  const tokenData = await tokenResponse.json();
  const userResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userResponse.ok) {
    return new Response('Não foi possível ler o perfil Google.', { status: 401 });
  }

  const googleUser = (await userResponse.json()) as GoogleUser;
  const email = googleUser.email?.toLowerCase();

  if (!email || !googleUser.email_verified) {
    return new Response('E-mail Google não verificado.', { status: 403 });
  }

  const adminEmails = getAdminEmails();
  const isBootstrapAdmin = adminEmails.includes(email);
  let [authorizedUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!authorizedUser && isBootstrapAdmin) {
    const [created] = await db.insert(users).values({
      email,
      name: googleUser.name || null,
      avatar_url: googleUser.picture || null,
      role: 'administrador',
      active: true,
      marcas: [],
      categorias: [],
      last_login_at: new Date(),
    }).returning();
    authorizedUser = created;
  }

  if (!authorizedUser || !authorizedUser.active) {
    return new Response('Seu e-mail ainda não está autorizado no painel Casa Dantas.', { status: 403 });
  }

  const [updated] = await db.update(users)
    .set({
      name: googleUser.name || authorizedUser.name,
      avatar_url: googleUser.picture || authorizedUser.avatar_url,
      role: isBootstrapAdmin ? 'administrador' : authorizedUser.role,
      active: true,
      updated_at: new Date(),
      last_login_at: new Date(),
    })
    .where(eq(users.id, authorizedUser.id))
    .returning();

  const token = await createToken({
    userId: updated.id,
    email: updated.email,
    name: updated.name,
    role: updated.role,
    marcas: updated.marcas || [],
    categorias: updated.categorias || [],
  });

  setAdminCookie(cookies, token);
  cookies.delete('oauth_state', { path: '/' });

  return redirect('/admin');
};
