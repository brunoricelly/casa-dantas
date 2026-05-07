import postgres from 'postgres';
import crypto from 'node:crypto';

const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

if (!DATABASE_URL) {
  console.error('DATABASE_URL não configurado.');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, {
  prepare: false,
  connect_timeout: 10,
  idle_timeout: 20,
  max: 1,
});

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

try {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      avatar_url TEXT,
      password_hash TEXT,
      role VARCHAR(30) NOT NULL DEFAULT 'editor',
      marcas TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
      categorias TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      last_login_at TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      codigo VARCHAR(50) NOT NULL,
      nome VARCHAR(255) NOT NULL,
      especificacoes TEXT NOT NULL,
      marca VARCHAR(120),
      categoria VARCHAR(120),
      imagem_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS product_images (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      imagem_url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'editor'`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS marcas TEXT[] DEFAULT ARRAY[]::text[]`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS categorias TEXT[] DEFAULT ARRAY[]::text[]`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS imagem_url TEXT`;

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (email)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS products_codigo_unique_idx ON products (codigo)`;
  await sql`CREATE INDEX IF NOT EXISTS products_created_at_idx ON products (created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS product_images_product_id_idx ON product_images (product_id)`;

  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const existing = await sql`
      SELECT id FROM users WHERE email = ${ADMIN_EMAIL} LIMIT 1
    `;

    if (existing.length === 0) {
      await sql`
        INSERT INTO users (
          email,
          name,
          password_hash,
          role,
          active,
          created_at,
          updated_at
        )
        VALUES (
          ${ADMIN_EMAIL},
          'Administrador',
          ${hashPassword(ADMIN_PASSWORD)},
          'administrador',
          true,
          NOW(),
          NOW()
        )
      `;

      console.log(`Admin criado: ${ADMIN_EMAIL}`);
    } else {
      console.log(`Admin já existe: ${ADMIN_EMAIL}`);
    }
  } else {
    console.log('ADMIN_EMAIL ou ADMIN_PASSWORD não configurado. Seed de admin ignorado.');
  }

  console.log('Banco inicializado com sucesso.');
} catch (error) {
  console.error('Falha ao inicializar banco:', error);
  process.exit(1);
} finally {
  await sql.end();
}
