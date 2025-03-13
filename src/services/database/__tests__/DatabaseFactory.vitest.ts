import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { DatabaseFactory, DatabaseType } from '../DatabaseFactory.js';
import { PrismaDatabase } from '../implementations/PrismaDatabase.js';
import type { DatabaseConfig, IDatabase } from '../types.js';

// Mock environment variables
vi.mock('@lib/Env.js', () => ({
  Env: {
    DATABASE_SQLITE_URL: 'sqlite://test.db',
    DATABASE_MYSQL_URL: 'mysql://localhost:3306/test',
    DATABASE_POSTGRES_URL: 'postgresql://localhost:5432/test',
  }
}));

// Create a mock database
const createMockDb = () => ({
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  query: vi.fn().mockResolvedValue({}),
  checkDuplicate: vi.fn().mockResolvedValue(false),
  insertAd: vi.fn().mockResolvedValue(undefined),
  findAdById: vi.fn().mockResolvedValue(null),
  findAdByCreativeId: vi.fn().mockResolvedValue(null),
  exists: vi.fn().mockResolvedValue(false),
  isDuplicate: vi.fn().mockResolvedValue(false),
});

// Mock the PrismaDatabase implementation
vi.mock('../implementations/PrismaDatabase.js', () => {
  return {
    PrismaDatabase: vi.fn().mockImplementation(() => createMockDb())
  };
});

describe('DatabaseFactory', () => {
  let factory: DatabaseFactory;
  const config: DatabaseConfig = {
    connectionString: 'postgresql://localhost:5432/test',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    factory = DatabaseFactory.getInstance();
  });

  afterEach(async () => {
    try {
      await factory.closeAll();
    } catch (error) {
      // Ignore errors during cleanup
    }
  });

  describe('Singleton Pattern', () => {
    it('should create only one instance of DatabaseFactory', () => {
      const instance1 = DatabaseFactory.getInstance();
      const instance2 = DatabaseFactory.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Connection Pooling', () => {
    it('should reuse existing database connections', async () => {
      const db1 = await factory.createDatabase('prisma', config);
      const db2 = await factory.createDatabase('prisma', config);
      expect(db1).toBe(db2);
      expect(PrismaDatabase).toHaveBeenCalledTimes(1);
    });

    it('should create new connections for different configurations', async () => {
      // Mock PrismaDatabase to return unique objects for each call
      vi.mocked(PrismaDatabase)
        .mockImplementationOnce(() => createMockDb())
        .mockImplementationOnce(() => createMockDb());
        
      const config1: DatabaseConfig = { connectionString: 'postgresql://localhost:5432/test1' };
      const config2: DatabaseConfig = { connectionString: 'postgresql://localhost:5432/test2' };

      const db1 = await factory.createDatabase('prisma', config1);
      const db2 = await factory.createDatabase('prisma', config2);
      
      // The test should now pass as we've ensured different objects are returned
      expect(db1).not.toBe(db2);
      expect(PrismaDatabase).toHaveBeenCalledTimes(2);
    });
  });

  describe('Database Creation', () => {
    it('should create database for type prisma', async () => {
      const db = await factory.createDatabase('prisma', config);
      expect(db).toBeDefined();
      expect(db.connect).toBeDefined();
      expect(db.disconnect).toBeDefined();
    });

    it('should throw error for unsupported database type', async () => {
      const invalidType = 'invalid' as DatabaseType;
      await expect(factory.createDatabase(invalidType, config)).rejects.toThrow(
        'Unsupported database type'
      );
    });

    it('should handle connection failures gracefully', async () => {
      const failingConnectMock = createMockDb();
      failingConnectMock.connect = vi.fn().mockRejectedValue(new Error('Connection failed'));
      
      vi.mocked(PrismaDatabase).mockImplementationOnce(() => failingConnectMock as unknown as IDatabase);

      await expect(factory.createDatabase('prisma', config)).rejects.toThrow(
        'Failed to create database: Connection failed'
      );
    });
  });

  describe('Resource Cleanup', () => {
    it('should close all database connections', async () => {
      // We'll only test with prisma since that's what's supported in the implementation
      const db = await factory.createDatabase('prisma', config);
      await factory.closeAll();
      expect(db.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnection errors gracefully', async () => {
      const failingDisconnectMock = createMockDb();
      failingDisconnectMock.disconnect = vi.fn().mockRejectedValue(new Error('Disconnect failed'));
      
      vi.mocked(PrismaDatabase).mockImplementationOnce(() => failingDisconnectMock as unknown as IDatabase);
      
      await factory.createDatabase('prisma', config);

      await expect(factory.closeAll()).rejects.toThrow('Failed to close all databases');
    });
  });

  describe('Environment Integration', () => {
    it('should correctly use the connection string from config', async () => {
      // Test that the connection string is correctly used
      const customConfig: DatabaseConfig = { connectionString: 'postgresql://custom:5432/test' };
      await factory.createDatabase('prisma', customConfig);
      
      // We're testing that it passed through without errors - this indicates
      // the getDatabaseKey method correctly used our connection string
      expect(PrismaDatabase).toHaveBeenCalledWith(customConfig);
    });
  });
});