import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { getEnv } from '../utils/env';

const connectionString = getEnv('DATABASE_URL', 'postgres://postgres:postgres@localhost:5432/postgres');

const client = postgres(connectionString, {
  prepare: false,
  connect_timeout: 3,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
  max: 5,
});

export const db = drizzle(client, { schema });
