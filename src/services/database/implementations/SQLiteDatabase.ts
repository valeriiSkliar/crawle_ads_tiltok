import { IDatabase, DatabaseConfig, AdData } from '../types.js';
import * as sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

/**
 * SQLite database implementation using the sqlite and sqlite3 packages.
 * Implements the IDatabase interface for TikTok ads storage.
 */
export class SQLiteDatabase implements IDatabase {
    private db: Database | null = null;
    private connectionString: string;

    /**
     * Creates a new SQLite database instance.
     * @param config Database configuration
     * @throws Error if filename is not provided
     */
    constructor(config: DatabaseConfig) {
        if (!config.filename) {
            throw new Error('SQLite database filename is required');
        }
        this.connectionString = config.filename;
    }

    /**
     * Connects to the SQLite database and initializes tables if they don't exist.
     * @returns Promise that resolves when connected
     */
    async connect(): Promise<void> {
        try {
            this.db = await open({
                filename: this.connectionString,
                driver: sqlite3.Database
            });

            // Initialize tables if they don't exist
            await this.initializeTables();
        } catch (error) {
            throw new Error(`Failed to connect to SQLite database: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Disconnects from the SQLite database.
     * @returns Promise that resolves when disconnected
     */
    async disconnect(): Promise<void> {
        if (this.db) {
            await this.db.close();
            this.db = null;
        }
    }

    /**
     * Executes a SQL query with optional parameters.
     * @param sql SQL query string
     * @param params Query parameters (optional)
     * @returns Query result
     * @throws Error if not connected to database
     */
    async query<T>(sql: string, params?: unknown[]): Promise<T> {
        this.ensureConnected();
        
        try {
            if (sql.trim().toLowerCase().startsWith('select')) {
                return await this.db!.all(sql, params) as T;
            } else {
                return await this.db!.run(sql, params) as unknown as T;
            }
        } catch (error) {
            throw new Error(`SQLite query error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Checks for duplicate entries based on the provided key.
     * @param key Unique key to check for duplicates
     * @returns Whether a duplicate entry exists
     */
    async checkDuplicate(key: string): Promise<boolean> {
        this.ensureConnected();
        
        const result = await this.db!.get(
            'SELECT 1 FROM processed_items WHERE itemKey = ?',
            [key]
        );
        
        return Boolean(result);
    }

    /**
     * Inserts a new ad into the database.
     * @param data Ad data to insert
     */
    async insertAd(data: AdData): Promise<void> {
        this.ensureConnected();
        
        // Start a transaction
        await this.db!.run('BEGIN TRANSACTION');
        
        try {
            // Insert video info if provided
            let videoInfoId: string | null = null;
            
            if (data.videoInfo) {
                // Check if video info already exists
                const existingVideoInfo = await this.db!.get(
                    'SELECT vid FROM video_info WHERE vid = ?',
                    [data.videoInfo.vid]
                );
                
                if (!existingVideoInfo) {
                    // Insert video info
                    await this.db!.run(
                        `INSERT INTO video_info (vid, duration, cover, width, height) 
                         VALUES (?, ?, ?, ?, ?)`,
                        [
                            data.videoInfo.vid, 
                            data.videoInfo.duration, 
                            data.videoInfo.cover, 
                            data.videoInfo.width, 
                            data.videoInfo.height
                        ]
                    );
                    
                    // Insert video URL if provided
                    if (data.videoInfo.videoUrl) {
                        await this.db!.run(
                            `INSERT INTO video_urls (p720, videoInfoId) 
                             VALUES (?, ?)`,
                            [data.videoInfo.videoUrl.p720, data.videoInfo.vid]
                        );
                    }
                }
                
                videoInfoId = data.videoInfo.vid;
            }
            
            // Insert ad
            await this.db!.run(
                `INSERT INTO ads (id, countryCode, creativeId, advertiserId, advertiserName, metadata, videoInfoId, createdAt, updatedAt) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.id,
                    data.countryCode,
                    data.creativeId,
                    data.advertiserId,
                    data.advertiserName,
                    JSON.stringify(data.metadata),
                    videoInfoId,
                    data.createdAt || new Date(),
                    data.updatedAt || new Date()
                ]
            );
            
            // Mark as processed
            await this.db!.run(
                'INSERT INTO processed_items (itemKey, createdAt) VALUES (?, ?)',
                [data.id, new Date()]
            );
            
            // Commit transaction
            await this.db!.run('COMMIT');
        } catch (error) {
            // Rollback on error
            await this.db!.run('ROLLBACK');
            throw new Error(`Failed to insert ad: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Retrieves an ad by its ID.
     * @param id Ad ID to retrieve
     * @returns Ad data or null if not found
     */
    async findAdById(id: string): Promise<AdData | null> {
        this.ensureConnected();
        
        try {
            const ad = await this.db!.get(
                `SELECT a.*, v.vid, v.duration, v.cover, v.width, v.height, u.p720
                 FROM ads a
                 LEFT JOIN video_info v ON a.videoInfoId = v.vid
                 LEFT JOIN video_urls u ON v.vid = u.videoInfoId
                 WHERE a.id = ?`,
                [id]
            );
            
            if (!ad) return null;
            
            return this.mapToAdData(ad);
        } catch (error) {
            throw new Error(`Failed to find ad by ID: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Retrieves an ad by its creative ID.
     * @param id Creative ID to retrieve
     * @returns Ad data or null if not found
     */
    async findAdByCreativeId(id: string): Promise<AdData | null> {
        this.ensureConnected();
        
        try {
            const ad = await this.db!.get(
                `SELECT a.*, v.vid, v.duration, v.cover, v.width, v.height, u.p720
                 FROM ads a
                 LEFT JOIN video_info v ON a.videoInfoId = v.vid
                 LEFT JOIN video_urls u ON v.vid = u.videoInfoId
                 WHERE a.creativeId = ?`,
                [id]
            );
            
            if (!ad) return null;
            
            return this.mapToAdData(ad);
        } catch (error) {
            throw new Error(`Failed to find ad by creative ID: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Checks if an ad exists based on the provided criteria.
     * @param criteria Ad criteria to search for
     * @returns Whether an ad exists
     */
    async exists(criteria: Partial<AdData>): Promise<boolean> {
        this.ensureConnected();
        
        // Build WHERE clause from criteria
        const conditions: string[] = [];
        const params: any[] = [];
        
        for (const [key, value] of Object.entries(criteria)) {
            if (value !== undefined && !['videoInfo', 'metadata'].includes(key)) {
                conditions.push(`${key} = ?`);
                params.push(value);
            }
        }
        
        if (conditions.length === 0) {
            return false;
        }
        
        const whereClause = conditions.join(' AND ');
        
        try {
            const result = await this.db!.get(
                `SELECT 1 FROM ads WHERE ${whereClause} LIMIT 1`,
                params
            );
            
            return Boolean(result);
        } catch (error) {
            throw new Error(`Failed to check if ad exists: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Checks if an ad is a duplicate based on the provided data.
     * @param data Ad data to check for duplicates
     * @returns Whether the ad is a duplicate
     */
    async isDuplicate(data: AdData): Promise<boolean> {
        return this.exists({
            id: data.id,
            creativeId: data.creativeId
        });
    }

    /**
     * Maps raw SQLite result to AdData interface.
     * @param row Database result row
     * @returns Structured AdData object
     */
    private mapToAdData(row: any): AdData {
        const adData: AdData = {
            id: row.id,
            countryCode: row.countryCode,
            creativeId: row.creativeId,
            advertiserId: row.advertiserId,
            advertiserName: row.advertiserName,
            metadata: JSON.parse(row.metadata),
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt)
        };
        
        // Add video info if available
        if (row.vid) {
            adData.videoInfo = {
                vid: row.vid,
                duration: row.duration,
                cover: row.cover,
                width: row.width,
                height: row.height
            };
            
            // Add video URL if available
            if (row.p720) {
                adData.videoInfo.videoUrl = {
                    p720: row.p720
                };
            }
        }
        
        return adData;
    }

    /**
     * Initializes database tables if they don't exist.
     * @private
     */
    private async initializeTables(): Promise<void> {
        const createTables = [
            `CREATE TABLE IF NOT EXISTS ads (
                id TEXT PRIMARY KEY,
                countryCode TEXT NOT NULL,
                creativeId TEXT NOT NULL,
                advertiserId TEXT NOT NULL,
                advertiserName TEXT NOT NULL,
                metadata TEXT NOT NULL,
                videoInfoId TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )`,
            
            `CREATE TABLE IF NOT EXISTS video_info (
                vid TEXT PRIMARY KEY,
                duration INTEGER NOT NULL,
                cover TEXT NOT NULL,
                width INTEGER NOT NULL,
                height INTEGER NOT NULL
            )`,
            
            `CREATE TABLE IF NOT EXISTS video_urls (
                id TEXT PRIMARY KEY,
                p720 TEXT NOT NULL,
                videoInfoId TEXT UNIQUE NOT NULL,
                FOREIGN KEY (videoInfoId) REFERENCES video_info (vid)
            )`,
            
            `CREATE TABLE IF NOT EXISTS processed_items (
                itemKey TEXT PRIMARY KEY,
                createdAt TEXT NOT NULL
            )`
        ];
        
        const createIndexes = [
            `CREATE INDEX IF NOT EXISTS idx_ads_creative_id ON ads (creativeId)`,
            `CREATE INDEX IF NOT EXISTS idx_ads_advertiser_id ON ads (advertiserId)`
        ];
        
        for (const query of [...createTables, ...createIndexes]) {
            await this.db!.exec(query);
        }
    }

    /**
     * Ensures the database is connected before operations.
     * @private
     * @throws Error if not connected
     */
    private ensureConnected(): void {
        if (!this.db) {
            throw new Error('Not connected to SQLite database');
        }
    }
}