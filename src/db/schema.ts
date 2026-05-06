import { pgTable, text, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  codigo: varchar('codigo', { length: 50 }).notNull().unique(),
  nome: varchar('nome', { length: 255 }).notNull(),
  especificacoes: text('especificacoes').notNull(),
  imagem_url: text('imagem_url'),
  created_at: timestamp('created_at').defaultNow(),
});
