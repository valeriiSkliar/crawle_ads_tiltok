import { TikTokAdMaterial } from "@src/types/api.js";

/**
 * Represents the data structure for storing TikTok ads in the database.
 */
export interface AdData {
    id: string;
    countryCode: string;
    creativeId: string;
    advertiserId: string;
    advertiserName: string;
    createdAt: Date;
    metadata: TikTokAdMaterial[];
}

/**
 * Configuration options for database connections.
 * Supports both SQLite and PostgreSQL configurations.
 */
export interface DatabaseConfig {
    // Common options
    filename?: string;  // For SQLite

    // PostgreSQL specific options
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
}

/**
 * Core database interface following the interface-based design pattern.
 * Provides type-safe operations for database interactions.
 */
export interface IDatabase {
    // Connection management
    connect(): Promise<void>;
    disconnect(): Promise<void>;

    // Core operations
    query<T>(sql: string, params?: unknown[]): Promise<T>;
    checkDuplicate(key: string): Promise<boolean>;
    
    // Ad-specific operations
    insertAd(data: AdData): Promise<void>;
    findAdById(id: string): Promise<AdData | null>;
    findAdByCreativeId(creativeId: string): Promise<AdData | null>;
    exists(criteria: Partial<AdData>): Promise<boolean>;
    isDuplicate(data: AdData): Promise<boolean>;
}
