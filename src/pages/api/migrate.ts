import type { APIRoute } from 'astro';
import { db } from '../../db';
import { sql } from 'drizzle-orm';
import crypto from 'node:crypto';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export const GET: APIRoute = async () => {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255),
        avatar_url TEXT,
        password_hash TEXT,
        role VARCHAR(30) NOT NULL DEFAULT 'editor',
        marcas TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
        categorias TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP
      );
    `);

    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(30) NOT NULL DEFAULT 'editor';`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS marcas TEXT[] NOT NULL DEFAULT ARRAY[]::text[];`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS categorias TEXT[] NOT NULL DEFAULT ARRAY[]::text[];`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;`);

    const adminPassword = process.env.ADMIN_PASSWORD || '@Bruno363612';
    const hashedPw = hashPassword(adminPassword);

    await db.execute(sql`
      INSERT INTO users (email, name, password_hash, role, active, marcas, categorias)
      VALUES ('ricelly.bruno@gmail.com', 'Bruno Ricelly', ${hashedPw}, 'administrador', true, ARRAY[]::text[], ARRAY[]::text[])
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'administrador',
        active = true,
        updated_at = CURRENT_TIMESTAMP;
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(50) NOT NULL UNIQUE,
        nome VARCHAR(255) NOT NULL,
        especificacoes TEXT NOT NULL,
        imagem_url TEXT,
        marca VARCHAR(120),
        categoria VARCHAR(120),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS marca VARCHAR(120);`);
    await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS categoria VARCHAR(120);`);
    await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Banco atualizado: tabelas users e products prontas, admin criado.'
    }), { status: 200 });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
