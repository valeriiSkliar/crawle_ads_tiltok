import { Pool, PoolConfig } from 'pg';
import { IDatabase } from '../../../types/index.js';

export class PostgresDatabase implements IDatabase {
  private pool: Pool;

  constructor(config: PoolConfig) {
    this.pool = new Pool(config);
  }

  async connect(): Promise<void> {
    try {
      await this.pool.connect();
    } catch (error) {
      throw new Error(`Failed to connect to PostgreSQL: ${error instanceof Error ? error.message : String(error)}`);
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
}
