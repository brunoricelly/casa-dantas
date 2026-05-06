import type { AstroCookies } from 'astro';
import { SignJWT, jwtVerify } from 'jose';

export type UserRole = 'administrador' | 'editor';

export type SessionUser = {
  userId: number;
  email: string;
  name?: string | null;
  role: UserRole;
  marcas?: string[];
  categorias?: string[];
};

const rawSecret = import.meta.env.JWT_SECRET || 'dev-only-change-me-casa-dantas';
const JWT_SECRET = new TextEncoder().encode(rawSecret);

export function getSiteUrl(requestUrl?: string) {
  return (import.meta.env.PUBLIC_SITE_URL || import.meta.env.SITE_URL || requestUrl || 'https://casadantas.chatwoot.space').replace(/\/$/, '');
}

export function getAdminEmails() {
  const configured = `${import.meta.env.ADMIN_EMAILS || import.meta.env.ADMIN_EMAIL || 'ricelly.bruno@gmail.com'}`;
  return configured
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function createToken(payload: SessionUser) {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionUser;
  } catch (_) {
    return null;
  }
}

export async function getSession(cookies: AstroCookies): Promise<SessionUser | null> {
  const token = cookies.get('admin_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession(cookies: AstroCookies): Promise<SessionUser> {
  const session = await getSession(cookies);
  if (!session) throw new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
  return session;
}

export function requireAdmin(session: SessionUser) {
  if (session.role !== 'administrador') {
    throw new Response(JSON.stringify({ error: 'Acesso restrito ao administrador' }), { status: 403 });
  }
}

export function canManageCatalog(session: SessionUser) {
  return session.role === 'administrador' || session.role === 'editor';
}

export function canManageProductScope(session: SessionUser, marca?: string | null, categoria?: string | null) {
  if (session.role === 'administrador') return true;
  const allowedBrands = session.marcas || [];
  const allowedCategories = session.categorias || [];
  const brandAllowed = allowedBrands.length === 0 || !marca || allowedBrands.includes(marca);
  const categoryAllowed = allowedCategories.length === 0 || !categoria || allowedCategories.includes(categoria);
  return brandAllowed && categoryAllowed;
}

export function setAdminCookie(cookies: AstroCookies, token: string) {
  cookies.set('admin_token', token, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });
}
