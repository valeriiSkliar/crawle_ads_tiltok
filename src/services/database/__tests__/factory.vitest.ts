import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDatabase } from '../factory.js';
import { PrismaDatabase } from '../implementations/PrismaDatabase.js';
import { SQLiteDatabase } from '../implementations/SQLiteDatabase.js';
import type { DatabaseConfig } from '../types.js';

// Mock dependencies
vi.mock('../implementations/PrismaDatabase.js', () => ({
  PrismaDatabase: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('../implementations/SQLiteDatabase.js', () => ({
  SQLiteDatabase: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('Database Factory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a PrismaDatabase instance when type is prisma', () => {
    const config: DatabaseConfig = { connectionString: 'postgresql://localhost:5432/test' };
    const database = createDatabase('prisma', config);
    
    expect(database).toBeDefined();
    expect(PrismaDatabase).toHaveBeenCalledWith(config);
  });

  it('should create a SQLiteDatabase instance when type is sqlite', () => {
    const config: DatabaseConfig = { filename: 'test.db' };
    const database = createDatabase('sqlite', config);
    
    expect(database).toBeDefined();
    expect(SQLiteDatabase).toHaveBeenCalledWith(config);
  });

  it('should throw an error for unsupported database types', () => {
    const config: DatabaseConfig = {};
    // @ts-expect-error - Testing with invalid type
    expect(() => createDatabase('invalid', config)).toThrow('Unsupported database type');
  });
});