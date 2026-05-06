import type { APIRoute } from 'astro';
import { createToken } from '../../utils/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  const { username, password } = await request.json();

  const validUsername = import.meta.env.ADMIN_USERNAME || 'admin';
  const validPassword = import.meta.env.ADMIN_PASSWORD || 'casadantas2026'; // senha padrão temporária

  if (username === validUsername && password === validPassword) {
    const token = await createToken({ user: username });
    
    cookies.set('admin_token', token, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
};
