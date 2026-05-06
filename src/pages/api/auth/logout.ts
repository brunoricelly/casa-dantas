import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete('admin_token', { path: '/' });
  cookies.delete('oauth_state', { path: '/' });
  return redirect('/admin/login');
};
