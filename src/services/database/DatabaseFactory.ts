import { IDatabase } from '@src/services/database/types.js';
import type { DatabaseConfig } from '@src/services/database/types.js';
import { SQLiteDatabase } from './implementations/SQLiteDatabase.js';
import { PostgresDatabase } from './implementations/PostgresDatabase.js';

export type DatabaseType = 'sqlite' | 'postgres';

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
     * @param type - The type of database to create ('sqlite' or 'postgres')
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
                case 'sqlite':
                    this.validateSQLiteConfig(config);
                    database = new SQLiteDatabase(config);
                    break;
                case 'postgres':
                    this.validatePostgresConfig(config);
                    database = new PostgresDatabase(config);
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
        switch (type) {
            case 'sqlite':
                return `sqlite:${config.filename}`;
            case 'postgres':
                return `postgres:${config.host}:${config.port}:${config.database}`;
            default:
                throw new Error(`Unsupported database type: ${type}`);
        }
    }

    private validateSQLiteConfig(config: DatabaseConfig): void {
        if (!config.filename) {
            throw new Error('SQLite configuration must include a filename');
        }
    }

    private validatePostgresConfig(config: DatabaseConfig): void {
        const requiredFields = ['host', 'port', 'database', 'username'] as const;
        const missingFields = requiredFields.filter(field => !config[field]);
        
        if (missingFields.length > 0) {
            throw new Error(`PostgreSQL configuration missing required fields: ${missingFields.join(', ')}`);
        }
    }
}
