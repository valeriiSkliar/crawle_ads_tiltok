import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { AdData, DatabaseConfig } from '../types.js';

// Mock modules before importing SQLiteDatabase
vi.mock('sqlite3', () => ({
  Database: vi.fn(),
  verbose: vi.fn().mockReturnValue({
    Database: vi.fn()
  })
}));

// Create mock database methods
const mockMethods = {
  close: vi.fn().mockResolvedValue(undefined),
  run: vi.fn().mockResolvedValue({
    lastID: 1,
    changes: 1
  }),
  get: vi.fn().mockResolvedValue(null),
  all: vi.fn().mockResolvedValue([]),
  exec: vi.fn().mockResolvedValue(undefined)
};

// Mock sqlite library
vi.mock('sqlite', () => ({
  open: vi.fn().mockImplementation(() => Promise.resolve(mockMethods))
}));

// Import SQLiteDatabase implementation after mocks are set up
import { SQLiteDatabase } from '../implementations/SQLiteDatabase.js';
import { open } from 'sqlite';

describe('SQLiteDatabase', () => {
  let database: SQLiteDatabase;
  let mockDb: typeof mockMethods;
  
  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Initialize test database
    const config: DatabaseConfig = { filename: ':memory:' };
    database = new SQLiteDatabase(config);
    await database.connect();
    
    // Get the mock instance that was created during connect()
    mockDb = await vi.mocked(open).mock.results[0].value;
  });
  
  afterEach(async () => {
    try {
      await database?.disconnect();
    } catch {
      // Ignore cleanup errors
    }
  });
  
  describe('Constructor', () => {
    it('should throw error if filename is not provided', () => {
      expect(() => new SQLiteDatabase({} as DatabaseConfig)).toThrow('SQLite database filename is required');
    });
    
    it('should initialize with valid configuration', () => {
      const db = new SQLiteDatabase({ filename: 'test.db' });
      expect(db).toBeInstanceOf(SQLiteDatabase);
    });
  });
  
  describe('Connection', () => {
    it('should connect to database with correct parameters', async () => {
      expect(vi.mocked(open)).toHaveBeenCalledWith({
        filename: ':memory:',
        driver: expect.anything()
      });
      
      // Should initialize tables
      expect(mockDb.exec).toHaveBeenCalled();
    });
    
    it('should disconnect properly', async () => {
      await database.disconnect();
      expect(mockDb.close).toHaveBeenCalled();
    });
    
    it('should handle connection errors', async () => {
      vi.mocked(open).mockRejectedValueOnce(new Error('Connection error'));
      
      const testDb = new SQLiteDatabase({ filename: 'test.db' });
      await expect(testDb.connect()).rejects.toThrow('Failed to connect to SQLite database');
    });
  });
  
  describe('Query Operations', () => {
    it('should execute SELECT queries with all()', async () => {
      await database.query('SELECT * FROM ads');
      expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM ads', undefined);
    });
    
    it('should execute other SQL statements with run()', async () => {
      await database.query('INSERT INTO ads VALUES (?)', ['test']);
      expect(mockDb.run).toHaveBeenCalledWith('INSERT INTO ads VALUES (?)', ['test']);
    });
    
    it('should throw error when query fails', async () => {
      mockDb.all.mockRejectedValueOnce(new Error('Query failed'));
      await expect(database.query('SELECT * FROM test')).rejects.toThrow('SQLite query error');
    });
    
    it('should throw error if not connected', async () => {
      await database.disconnect();
      await expect(database.query('SELECT 1')).rejects.toThrow('Not connected to SQLite database');
    });
  });
  
  describe('Ad Operations', () => {
    const mockAd: AdData = {
      id: 'ad-123',
      countryCode: 'US',
      creativeId: 'creative-123',
      advertiserId: 'advertiser-123',
      advertiserName: 'Test Advertiser',
      metadata: { views: 1000, clicks: 50 },
      videoInfo: {
        vid: 'video-123',
        duration: 30,
        cover: 'https://example.com/cover.jpg',
        width: 1280,
        height: 720,
        videoUrl: {
          p720: 'https://example.com/video.mp4'
        }
      }
    };
    
    it('should check for duplicates', async () => {
      await database.checkDuplicate('test-key');
      expect(mockDb.get).toHaveBeenCalledWith(
        expect.stringContaining('FROM processed_items'),
        ['test-key']
      );
    });
    
    it('should insert ad with transaction', async () => {
      await database.insertAd(mockAd);
      
      // Should start transaction
      expect(mockDb.run).toHaveBeenCalledWith('BEGIN TRANSACTION');
      
      // Should check if video info exists
      expect(mockDb.get).toHaveBeenCalledWith(
        expect.stringContaining('FROM video_info WHERE vid'),
        [mockAd.videoInfo!.vid]
      );
      
      // Should insert video info
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO video_info'),
        expect.arrayContaining([mockAd.videoInfo!.vid])
      );
      
      // Should insert video URL
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO video_urls'),
        expect.arrayContaining([mockAd.videoInfo!.videoUrl!.p720])
      );
      
      // Should insert ad
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ads'),
        expect.arrayContaining([mockAd.id])
      );
      
      // Should mark as processed
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO processed_items'),
        [mockAd.id]
      );
      
      // Should commit transaction
      expect(mockDb.run).toHaveBeenCalledWith('COMMIT');
    });
    
    it('should rollback transaction on error', async () => {
      // Make transaction begin succeed but first query fail
      mockDb.run
        .mockResolvedValueOnce({ lastID: 0, changes: 0 }) // BEGIN TRANSACTION succeeds
        .mockRejectedValueOnce(new Error('Insert failed')); // First query fails
      
      await expect(database.insertAd(mockAd)).rejects.toThrow('Failed to insert ad');
      
      // Should roll back transaction
      expect(mockDb.run).toHaveBeenCalledWith('ROLLBACK');
    });
    
    it('should find ad by ID', async () => {
      await database.findAdById('ad-123');
      expect(mockDb.get).toHaveBeenCalledWith(
        expect.stringContaining('FROM ads a'),
        ['ad-123']
      );
    });
    
    it('should find ad by creative ID', async () => {
      await database.findAdByCreativeId('creative-123');
      expect(mockDb.get).toHaveBeenCalledWith(
        expect.stringContaining('FROM ads a'),
        ['creative-123']
      );
    });
    
    it('should check existence by criteria', async () => {
      await database.exists({ id: 'ad-123', creativeId: 'creative-123' });
      
      expect(mockDb.get).toHaveBeenCalledWith(
        expect.stringContaining('FROM ads WHERE'),
        expect.arrayContaining(['ad-123', 'creative-123'])
      );
    });
    
    it('should check for duplicates using exists()', async () => {
      const existsSpy = vi.spyOn(database, 'exists').mockResolvedValue(false);
      
      await database.isDuplicate(mockAd);
      expect(existsSpy).toHaveBeenCalledWith({
        id: mockAd.id,
        creativeId: mockAd.creativeId
      });
    });
  });
});