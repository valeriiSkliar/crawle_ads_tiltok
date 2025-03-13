import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest';
import { PrismaDatabase } from '../../implementations/PrismaDatabase.js';
import type { AdData, DatabaseConfig } from '../../types.js';

// Mock Prisma client
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn(() => ({
      $connect: vi.fn().mockResolvedValue(undefined),
      $disconnect: vi.fn().mockResolvedValue(undefined),
      $queryRawUnsafe: vi.fn().mockResolvedValue([]),
      processedItem: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ itemKey: 'test-id' }),
      },
      videoInfo: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          vid: 'test-vid',
          duration: 30,
          cover: 'cover-url',
          width: 720,
          height: 1280
        }),
      },
      ad: {
        create: vi.fn().mockResolvedValue({
          id: 'test-id',
          countryCode: 'US',
          creativeId: 'test-creative',
          advertiserId: 'test-advertiser',
          advertiserName: 'Test Advertiser',
          metadata: {}
        }),
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0),
      }
    }))
  };
});

// Mock the prisma instance
vi.mock('../../prisma/client.js', () => {
  return {
    prisma: {
      $connect: vi.fn().mockResolvedValue(undefined),
      $disconnect: vi.fn().mockResolvedValue(undefined),
      $queryRawUnsafe: vi.fn().mockResolvedValue([]),
      processedItem: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ itemKey: 'test-id' }),
      },
      videoInfo: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          vid: 'test-vid',
          duration: 30,
          cover: 'cover-url',
          width: 720,
          height: 1280
        }),
      },
      ad: {
        create: vi.fn().mockResolvedValue({
          id: 'test-id',
          countryCode: 'US',
          creativeId: 'test-creative',
          advertiserId: 'test-advertiser',
          advertiserName: 'Test Advertiser',
          metadata: {}
        }),
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0),
      }
    }
  };
});

describe('PrismaDatabase', () => {
  let database: PrismaDatabase;
  let originalEnv: NodeJS.ProcessEnv;
  
  const config: DatabaseConfig = {
    connectionString: 'postgresql://localhost:5432/test'
  };

  beforeAll(() => {
    originalEnv = { ...process.env };
  });

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    database = new PrismaDatabase(config);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('Constructor', () => {
    it('should throw an error if connectionString is not provided', () => {
      expect(() => new PrismaDatabase({} as DatabaseConfig)).toThrowError(
        'DATABASE_URL environment variable is required'
      );
    });

    it('should set the DATABASE_URL environment variable', () => {
      expect(process.env.DATABASE_URL).toBe(config.connectionString);
    });
  });

  describe('Connection Methods', () => {
    it('should connect to the database', async () => {
      const { prisma } = await import('../../prisma/client.js');
      await database.connect();
      expect(prisma.$connect).toHaveBeenCalled();
    });

    it('should disconnect from the database', async () => {
      const { prisma } = await import('../../prisma/client.js');
      await database.disconnect();
      expect(prisma.$disconnect).toHaveBeenCalled();
    });
  });

  describe('Query Method', () => {
    it('should execute raw SQL queries', async () => {
      const { prisma } = await import('../../prisma/client.js');
      const sql = 'SELECT * FROM ads';
      const params = ['param1', 'param2'];
      await database.query(sql, params);
      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(sql, ...params);
    });
  });

  describe('Data Operations', () => {
    const mockAdData: AdData = {
      id: 'test-id',
      countryCode: 'US',
      creativeId: 'test-creative',
      advertiserId: 'test-advertiser',
      advertiserName: 'Test Advertiser',
      metadata: {},
      videoInfo: {
        vid: 'test-vid',
        duration: 30,
        cover: 'cover-url',
        width: 720,
        height: 1280,
        videoUrl: {
          p720: 'video-url'
        }
      }
    };

    it('should check for duplicates', async () => {
      const { prisma } = await import('../../prisma/client.js');
      await database.checkDuplicate('test-key');
      expect(prisma.processedItem.findUnique).toHaveBeenCalledWith({
        where: { itemKey: 'test-key' }
      });
    });

    it('should insert an ad with video info', async () => {
      const { prisma } = await import('../../prisma/client.js');
      await database.insertAd(mockAdData);
      
      // Should check if video info exists
      expect(prisma.videoInfo.findUnique).toHaveBeenCalledWith({
        where: { vid: mockAdData.videoInfo!.vid }
      });
      
      // Should create video info with URL
      expect(prisma.videoInfo.create).toHaveBeenCalled();
      
      // Should create the ad
      expect(prisma.ad.create).toHaveBeenCalled();
      
      // Should mark the item as processed
      expect(prisma.processedItem.create).toHaveBeenCalledWith({
        data: { itemKey: mockAdData.id }
      });
    });

    it('should check if an ad exists', async () => {
      const { prisma } = await import('../../prisma/client.js');
      const criteria = { id: 'test-id', creativeId: 'test-creative' };
      await database.exists(criteria);
      expect(prisma.ad.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ 
          id: criteria.id, 
          creativeId: criteria.creativeId 
        })
      });
    });

    it('should check if an ad is a duplicate', async () => {
      vi.spyOn(database, 'exists').mockResolvedValue(false);
      await database.isDuplicate(mockAdData);
      expect(database.exists).toHaveBeenCalledWith({
        id: mockAdData.id,
        creativeId: mockAdData.creativeId
      });
    });
  });
});