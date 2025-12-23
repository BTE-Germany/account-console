import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/db/schema';

const globalForDatabase = globalThis as unknown as {
    database: ReturnType<typeof drizzle> | undefined;
};

const pool =
    globalForDatabase.database === undefined
        ? new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: false
        })
        : undefined;

export const database =
    globalForDatabase.database ?? drizzle(pool!, { schema });

if (process.env.NODE_ENV !== 'production') {
    globalForDatabase.database = database;
}
