import { Pool, PoolConfig } from 'pg';
import { IDatabase } from '@src/services/database/types.js';
import type { DatabaseConfig, AdData } from '@src/services/database/types.js';

export class PostgresDatabase implements IDatabase {
  private pool: Pool;

  constructor(config: DatabaseConfig) {
    const poolConfig: PoolConfig = {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password
    };
    this.pool = new Pool(poolConfig);
  }

  async connect(): Promise<void> {
    try {
      await this.pool.connect();
      await this.initializeDatabase();
    } catch (error) {
      throw new Error(`Failed to connect to PostgreSQL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async initializeDatabase(): Promise<void> {
    const tables = [
      `CREATE TABLE IF NOT EXISTS ads (
        id TEXT PRIMARY KEY,
        country_code TEXT NOT NULL,
        creative_id TEXT UNIQUE NOT NULL,
        advertiser_id TEXT NOT NULL,
        advertiser_name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        metadata JSONB NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS processed_items (
        item_key TEXT PRIMARY KEY,
        processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const sql of tables) {
      await this.query(sql);
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }

  async query<T>(sql: string, params?: unknown[]): Promise<T> {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows as T;
    } catch (error) {
      throw new Error(`PostgreSQL query error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async checkDuplicate(key: string): Promise<boolean> {
    try {
      const result = await this.query<Array<{ exists: boolean }>>(
        'SELECT EXISTS(SELECT 1 FROM processed_items WHERE item_key = $1)',
        [key]
      );
      return result[0]?.exists ?? false;
    } catch (error) {
      throw new Error(`Failed to check duplicate: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async insertAd(data: AdData): Promise<void> {
    const sql = `
      INSERT INTO ads (
        id, country_code, creative_id, advertiser_id, 
        advertiser_name, created_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    const params = [
      data.id,
      data.countryCode,
      data.creativeId,
      data.advertiserId,
      data.advertiserName,
      data.createdAt,
      data.metadata
    ];

    try {
      await this.query(sql, params);
    } catch (error) {
      throw new Error(`Failed to insert ad: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findAdById(id: string): Promise<AdData | null> {
    try {
      const result = await this.query<AdData[]>(
        'SELECT * FROM ads WHERE id = $1',
        [id]
      );
      return result[0] || null;
    } catch (error) {
      throw new Error(`Failed to find ad by ID: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findAdByCreativeId(creativeId: string): Promise<AdData | null> {
    try {
      const result = await this.query<AdData[]>(
        'SELECT * FROM ads WHERE creative_id = $1',
        [creativeId]
      );
      return result[0] || null;
    } catch (error) {
      throw new Error(`Failed to find ad by creative ID: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async exists(criteria: Partial<AdData>): Promise<boolean> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    Object.entries(criteria).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeKey = this.camelToSnakeCase(key);
        conditions.push(`${snakeKey} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    try {
      const result = await this.query<Array<{ exists: boolean }>>(
        `SELECT EXISTS(SELECT 1 FROM ads WHERE ${conditions.join(' AND ')}) as exists`,
        params
      );
      return result[0]?.exists ?? false;
    } catch (error) {
      throw new Error(`Failed to check existence: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async isDuplicate(data: AdData): Promise<boolean> {
    return this.exists({
      creativeId: data.creativeId,
      advertiserId: data.advertiserId
    });
  }

  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}
