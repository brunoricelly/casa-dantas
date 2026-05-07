import { sql } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export type UserRole = 'administrador' | 'editor';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  avatar_url: text('avatar_url'),
  password_hash: text('password_hash'),
  role: varchar('role', { length: 30 }).$type<UserRole>().notNull().default('editor'),
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

export const productImages = pgTable('product_images', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  imagem_url: text('imagem_url').notNull(),
  sort_order: integer('sort_order').notNull().default(0),
  created_at: timestamp('created_at').defaultNow(),
});
