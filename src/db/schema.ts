import { sql } from 'drizzle-orm';
import { boolean, pgEnum, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['administrador', 'editor']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  avatar_url: text('avatar_url'),
  role: userRole('role').notNull().default('editor'),
  marcas: text('marcas').array().notNull().default(sql`ARRAY[]::text[]`),
  categorias: text('categorias').array().notNull().default(sql`ARRAY[]::text[]`),
  active: boolean('active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  last_login_at: timestamp('last_login_at'),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  codigo: varchar('codigo', { length: 50 }).notNull().unique(),
  nome: varchar('nome', { length: 255 }).notNull(),
  especificacoes: text('especificacoes').notNull(),
  marca: varchar('marca', { length: 120 }),
  categoria: varchar('categoria', { length: 120 }),
  imagem_url: text('imagem_url'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});
