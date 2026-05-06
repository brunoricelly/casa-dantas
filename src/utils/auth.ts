import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(import.meta.env.JWT_SECRET || 'super-secret-key-casa-dantas-12345');

export async function createToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (e) {
    return null;
  }
}
