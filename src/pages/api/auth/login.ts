import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { createToken, setAdminCookie } from '../../../utils/auth';
import * as crypto from 'node:crypto';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const attempt = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return attempt === hash;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, senha } = body as { email?: string; senha?: string };

    if (!email || !senha) {
      return new Response(JSON.stringify({ error: 'E-mail e senha são obrigatórios.' }), { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, normalizedEmail), eq(users.active, true)))
      .limit(1);

    if (!user || !user.password_hash) {
      return new Response(JSON.stringify({ error: 'E-mail ou senha inválidos.' }), { status: 401 });
    }

    // Verify password
    if (!verifyPassword(senha, user.password_hash)) {
      return new Response(JSON.stringify({ error: 'E-mail ou senha inválidos.' }), { status: 401 });
    }

    // Update last login
    await db
      .update(users)
      .set({ last_login_at: new Date() })
      .where(eq(users.id, user.id));

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      marcas: user.marcas || [],
      categorias: user.categorias || [],
    });

    // Set cookie
    setAdminCookie(cookies, token);

    return new Response(JSON.stringify({
      success: true,
      user: { email: user.email, name: user.name, role: user.role },
    }), { status: 200 });
  } catch (e: any) {
    console.error('Login error:', e);
    return new Response(JSON.stringify({ error: 'Erro interno. Tente novamente.' }), { status: 500 });
  }
};
