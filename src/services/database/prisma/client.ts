import { PrismaClient } from '@prisma/client';
import { Env } from '@lib/Env.js';

/**
 * Singleton instance of PrismaClient for database operations.
 * Uses DATABASE_URL from environment variables for connection.
 * Falls back to DATABASE_SQLITE_URL if DATABASE_URL is not set.
 */
// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL && Env.DATABASE_SQLITE_URL) {
    process.env.DATABASE_URL = Env.DATABASE_SQLITE_URL;
}

export const prisma = new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'pretty'
});
