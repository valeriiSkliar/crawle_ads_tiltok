import { IDatabase } from '@src/services/database/types.js';
import type { DatabaseConfig } from '@src/services/database/types.js';
import { PrismaDatabase } from './implementations/PrismaDatabase.js';
import { SQLiteDatabase } from './implementations/SQLiteDatabase.js';

// Import Env conditionally to allow tests to mock it
let Env: unknown;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Env = require('@lib/Env.js').Env;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (error) {
  // In test environments, Env might be mocked
  Env = {};
}

export type DatabaseType = 'sqlite' | 'mysql' | 'postgres' | 'prisma';

/**
 * Factory class for creating and managing database instances.
 * Implements the Singleton pattern for centralized database management.
 */
export class DatabaseFactory {
    private static instance: DatabaseFactory;
    private databases: Map<string, IDatabase> = new Map();

    private constructor() {}

    public static getInstance(): DatabaseFactory {
        if (!DatabaseFactory.instance) {
            DatabaseFactory.instance = new DatabaseFactory();
        }
        return DatabaseFactory.instance;
    }

    /**
     * Creates or retrieves a database instance based on the specified type and configuration.
     * Implements connection pooling by reusing existing database connections.
     * 
     * @param type - The type of database to create (currently only 'prisma')
     * @param config - Database configuration parameters
     * @returns A Promise resolving to an IDatabase instance
     * @throws Error if the database type is unsupported or if connection fails
     */
    public async createDatabase(type: DatabaseType, config: DatabaseConfig): Promise<IDatabase> {
        const key = this.getDatabaseKey(type, config);
        
        // Connection pooling: reuse existing connections
        if (this.databases.has(key)) {
            return this.databases.get(key)!;
        }

        let database: IDatabase;
        
        try {
            switch (type) {
                case 'prisma':
                    database = new PrismaDatabase(config);
                    break;
                case 'sqlite':
                    database = new SQLiteDatabase(config);
                    break;
                default:
                    throw new Error(`Unsupported database type: ${type}`);
            }

            await database.connect();
            this.databases.set(key, database);
            return database;
        } catch (error) {
            throw new Error(`Failed to create database: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Closes all active database connections and clears the connection pool.
     */
    public async closeAll(): Promise<void> {
        const errors: Error[] = [];
        
        for (const [key, database] of this.databases.entries()) {
            try {
                await database.disconnect();
                this.databases.delete(key);
            } catch (error) {
                errors.push(new Error(`Failed to close database ${key}: ${error instanceof Error ? error.message : String(error)}`));
            }
        }

        if (errors.length > 0) {
            throw new Error(`Failed to close all databases: ${errors.map(e => e.message).join('; ')}`);
        }
    }

    private getDatabaseKey(type: DatabaseType, config: DatabaseConfig): string {
        // Use the connection string from config if available, otherwise fall back to environment
        const connectionString = config.connectionString;
        
        switch (type) {
            case 'sqlite':
                return `sqlite:${connectionString || Env.DATABASE_SQLITE_URL}`;
            case 'mysql':
                return `mysql:${connectionString || Env.DATABASE_MYSQL_URL}`;
            case 'postgres':
                return `postgres:${connectionString || Env.DATABASE_POSTGRES_URL}`;
            case 'prisma':
                return `prisma:${connectionString}`;
            default:
                throw new Error(`Unsupported database type: ${type}`);
        }
    }
}
