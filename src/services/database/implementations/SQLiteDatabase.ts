import { Database } from 'sqlite3';
import { IDatabase } from '@src/services/database/types.js';
import type { DatabaseConfig, AdData } from '@src/services/database/types.js';

export class SQLiteDatabase implements IDatabase {
    private db: Database | null = null;
    private readonly config: DatabaseConfig;

    constructor(config: DatabaseConfig) {
        if (!config.filename) {
            throw new Error('SQLite database filename is required');
        }
        this.config = config;
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db = new Database(this.config.filename!, async (err) => {
                if (err) {
                    reject(new Error(`Failed to connect to SQLite: ${err.message}`));
                    return;
                }
                await this.initializeDatabase();
                resolve();
            });
        });
    }

    private async initializeDatabase(): Promise<void> {
        const tables = [
            `CREATE TABLE IF NOT EXISTS ads (
                id TEXT PRIMARY KEY,
                country_code TEXT NOT NULL,
                creative_id TEXT UNIQUE NOT NULL,
                advertiser_id TEXT NOT NULL,
                advertiser_name TEXT NOT NULL,
                created_at DATETIME NOT NULL,
                metadata TEXT NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS processed_items (
                item_key TEXT PRIMARY KEY,
                processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];
        
        for (const sql of tables) {
            await new Promise<void>((resolve, reject) => {
                this.db!.run(sql, (err) => {
                    if (err) reject(new Error(`Failed to initialize database: ${err.message}`));
                    else resolve();
                });
            });
        }
    }

    async disconnect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) reject(new Error(`Failed to close SQLite connection: ${err.message}`));
                    else {
                        this.db = null;
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    async query<T>(sql: string, params?: unknown[]): Promise<T> {
        return new Promise((resolve, reject) => {
            this.db!.all(sql, params, (err, rows) => {
                if (err) reject(new Error(`SQLite query error: ${err.message}`));
                else resolve(rows as T);
            });
        });
    }

    async checkDuplicate(key: string): Promise<boolean> {
        try {
            const result = await this.query<Array<{ exists: number }>>(
                'SELECT EXISTS(SELECT 1 FROM processed_items WHERE item_key = ?) as exists',
                [key]
            );
            return result[0]?.exists === 1;
        } catch (error) {
            throw new Error(`Failed to check duplicate: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async insertAd(data: AdData): Promise<void> {
        const sql = `
            INSERT INTO ads (
                id, country_code, creative_id, advertiser_id, 
                advertiser_name, created_at, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            data.id,
            data.countryCode,
            data.creativeId,
            data.advertiserId,
            data.advertiserName,
            data.createdAt.toISOString(),
            JSON.stringify(data.metadata)
        ];

        return new Promise((resolve, reject) => {
            this.db!.run(sql, params, (err) => {
                if (err) reject(new Error(`Failed to insert ad: ${err.message}`));
                else resolve();
            });
        });
    }

    async findAdById(id: string): Promise<AdData | null> {
        const sql = 'SELECT * FROM ads WHERE id = ?';
        
        return new Promise((resolve, reject) => {
            this.db!.get(sql, [id], (err, row) => {
                if (err) {
                    reject(new Error(`Failed to find ad by ID: ${err.message}`));
                } else if (!row) {
                    resolve(null);
                } else {
                    resolve(this.mapRowToAdData(row));
                }
            });
        });
    }

    async findAdByCreativeId(creativeId: string): Promise<AdData | null> {
        const sql = 'SELECT * FROM ads WHERE creative_id = ?';
        
        return new Promise((resolve, reject) => {
            this.db!.get(sql, [creativeId], (err, row) => {
                if (err) {
                    reject(new Error(`Failed to find ad by creative ID: ${err.message}`));
                } else if (!row) {
                    resolve(null);
                } else {
                    resolve(this.mapRowToAdData(row));
                }
            });
        });
    }

    async exists(criteria: Partial<AdData>): Promise<boolean> {
        const conditions: string[] = [];
        const params: unknown[] = [];

        Object.entries(criteria).forEach(([key, value]) => {
            if (value !== undefined) {
                const snakeKey = this.camelToSnakeCase(key);
                conditions.push(`${snakeKey} = ?`);
                params.push(value);
            }
        });

        const sql = `SELECT EXISTS(SELECT 1 FROM ads WHERE ${conditions.join(' AND ')}) as exists`;

        return new Promise((resolve, reject) => {
            this.db!.get(sql, params, (err, row: { exists: number } | undefined) => {
                if (err) reject(new Error(`Failed to check existence: ${err.message}`));
                else resolve(row?.exists === 1);
            });
        });
    }

    async isDuplicate(data: AdData): Promise<boolean> {
        return this.exists({
            creativeId: data.creativeId,
            advertiserId: data.advertiserId
        });
    }

    private mapRowToAdData(row: unknown): AdData {
        if (!row || typeof row !== 'object') {
            throw new Error('Invalid database row');
        }
        
        const typedRow = row as Record<string, unknown>;
        
        if (!this.validateAdDataRow(typedRow)) {
            throw new Error('Invalid ad data structure in database');
        }

        return {
            id: typedRow.id as string,
            countryCode: typedRow.country_code as string,
            creativeId: typedRow.creative_id as string,
            advertiserId: typedRow.advertiser_id as string,
            advertiserName: typedRow.advertiser_name as string,
            createdAt: new Date(typedRow.created_at as string),
            metadata: JSON.parse(typedRow.metadata as string)
        };
    }

    private validateAdDataRow(row: Record<string, unknown>): boolean {
        return typeof row.id === 'string' &&
               typeof row.country_code === 'string' &&
               typeof row.creative_id === 'string' &&
               typeof row.advertiser_id === 'string' &&
               typeof row.advertiser_name === 'string' &&
               typeof row.created_at === 'string' &&
               typeof row.metadata === 'string';
    }

    private camelToSnakeCase(str: string): string {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
}
