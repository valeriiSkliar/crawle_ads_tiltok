import { IDatabase, DatabaseConfig } from './types.js';
import { SQLiteDatabase } from './implementations/SQLiteDatabase.js';
import { PostgresDatabase } from './implementations/PostgresDatabase.js';

export type DatabaseType = 'sqlite' | 'postgres';

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

    public async createDatabase(type: DatabaseType, config: DatabaseConfig): Promise<IDatabase> {
        const key = this.getDatabaseKey(type, config);
        
        if (this.databases.has(key)) {
            return this.databases.get(key)!;
        }

        let database: IDatabase;
        
        switch (type) {
            case 'sqlite':
                database = new SQLiteDatabase(config);
                break;
            case 'postgres':
                database = new PostgresDatabase(config);
                break;
            default:
                throw new Error(`Unsupported database type: ${type}`);
        }

        await database.connect();
        this.databases.set(key, database);
        return database;
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

    public async closeAll(): Promise<void> {
        const closePromises = Array.from(this.databases.values()).map(db => db.disconnect());
        await Promise.all(closePromises);
        this.databases.clear();
    }
}
