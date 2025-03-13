// import { TikTokAdMaterial } from "@src/types/api.js";

import type { Prisma } from '@prisma/client';

/**
 * Represents database configuration options.
 */
export interface DatabaseConfig {
    /**
     * PostgreSQL connection string (optional)
     */
    connectionString?: string;
    /**
     * SQLite database filename (optional)
     */
    filename?: string;
}

/**
 * Represents video URL information for TikTok ads
 */
export interface VideoUrl {
    /**
     * URL for 720p video
     */
    p720: string;
}

/**
 * Represents video metadata for TikTok ads
 */
export interface VideoInfo {
    /**
     * Unique video ID
     */
    vid: string;
    /**
     * Video duration in seconds
     */
    duration: number;
    /**
     * Video cover image URL
     */
    cover: string;
    /**
     * Video width in pixels
     */
    width: number;
    /**
     * Video height in pixels
     */
    height: number;
    /**
     * Video URL information
     */
    videoUrl?: VideoUrl;
}

/**
 * Represents the data structure for storing TikTok ads in the database.
 */
export interface AdData {
    /**
     * Unique ad ID
     */
    id: string;
    /**
     * Country code
     */
    countryCode: string;
    /**
     * Creative ID
     */
    creativeId: string;
    /**
     * Advertiser ID
     */
    advertiserId: string;
    /**
     * Advertiser name
     */
    advertiserName: string;
    /**
     * Additional metadata as JSON
     */
    metadata: Prisma.InputJsonValue;
    /**
     * Video metadata (optional)
     */
    videoInfo?: VideoInfo;
    /**
     * Creation timestamp (optional)
     */
    createdAt?: Date;
    /**
     * Update timestamp (optional)
     */
    updatedAt?: Date;
}

/**
 * Type for database type
 */
export type DatabaseType = 'prisma' | 'sqlite';

/**
 * Core database interface following the interface-based design pattern.
 * Provides type-safe operations for database interactions.
 */
export interface IDatabase {
    /**
     * Establishes a connection to the database.
     */
    connect(): Promise<void>;
    /**
     * Disconnects from the database.
     */
    disconnect(): Promise<void>;

    /**
     * Executes a SQL query with optional parameters.
     * @param sql SQL query string
     * @param params Query parameters (optional)
     * @returns Query result
     */
    query<T>(sql: string, params?: unknown[]): Promise<T>;
    /**
     * Checks for duplicate entries based on the provided key.
     * @param key Unique key to check for duplicates
     * @returns Whether a duplicate entry exists
     */
    checkDuplicate(key: string): Promise<boolean>;
    
    /**
     * Inserts a new ad into the database.
     * @param data Ad data to insert
     */
    insertAd(data: AdData): Promise<void>;
    /**
     * Retrieves an ad by its ID.
     * @param id Ad ID to retrieve
     * @returns Ad data or null if not found
     */
    findAdById(id: string): Promise<AdData | null>;
    /**
     * Retrieves an ad by its creative ID.
     * @param id Creative ID to retrieve
     * @returns Ad data or null if not found
     */
    findAdByCreativeId(id: string): Promise<AdData | null>;
    /**
     * Checks if an ad exists based on the provided criteria.
     * @param criteria Ad criteria to search for
     * @returns Whether an ad exists
     */
    exists(criteria: Partial<AdData>): Promise<boolean>;
    /**
     * Checks if an ad is a duplicate based on the provided data.
     * @param data Ad data to check for duplicates
     * @returns Whether the ad is a duplicate
     */
    isDuplicate(data: AdData): Promise<boolean>;
}
