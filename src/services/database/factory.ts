import { DatabaseType, IDatabase } from './types.js';
import type { DatabaseConfig } from './types.js';
import { PrismaDatabase } from './implementations/PrismaDatabase.js';
import { SQLiteDatabase } from './implementations/SQLiteDatabase.js';

/**
 * Simple factory function for creating database instances.
 * @param type Database type to create
 * @param config Database configuration parameters
 * @returns Database instance
 * @throws Error if the database type is unsupported
 */
export function createDatabase(type: DatabaseType, config: DatabaseConfig): IDatabase {
    switch (type) {
        case 'prisma':
            return new PrismaDatabase(config);
        case 'sqlite':
            return new SQLiteDatabase(config);
        default:
            throw new Error(`Unsupported database type: ${type}`);
    }
}