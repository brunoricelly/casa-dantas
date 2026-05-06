import type { APIRoute } from 'astro';
import { db } from '../../db';
import { sql } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    await db.execute(sql`DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('administrador', 'editor');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255),
        avatar_url TEXT,
        role user_role NOT NULL DEFAULT 'editor',
        marcas TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
        categorias TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(50) NOT NULL UNIQUE,
        nome VARCHAR(255) NOT NULL,
        especificacoes TEXT NOT NULL,
        imagem_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS marca VARCHAR(120);`);
    await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS categoria VARCHAR(120);`);
    await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

    await db.execute(sql`
      INSERT INTO users (email, name, role, active, marcas, categorias)
      VALUES ('ricelly.bruno@gmail.com', 'Bruno Ricelly', 'administrador', true, ARRAY[]::text[], ARRAY[]::text[])
      ON CONFLICT (email) DO UPDATE SET
        role = 'administrador',
        active = true,
        updated_at = CURRENT_TIMESTAMP;
    `);

    return new Response(JSON.stringify({
      success: true,
      message: 'Banco atualizado: produtos, usuários, perfis, marcas e categorias prontos.'
    }), { status: 200 });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
