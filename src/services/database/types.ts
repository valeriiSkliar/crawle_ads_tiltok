export interface AdData {
    id: string;
    countryCode: string;
    creativeId: string;
    advertiserId: string;
    advertiserName: string;
    createdAt: Date;
    metadata: Record<string, any>;
}

export interface DatabaseConfig {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database?: string;
    filename?: string; // For SQLite
}

export interface IDatabase {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    insertAd(data: AdData): Promise<void>;
    findAdById(id: string): Promise<AdData | null>;
    findAdByCreativeId(creativeId: string): Promise<AdData | null>;
    exists(criteria: Partial<AdData>): Promise<boolean>;
    isDuplicate(data: AdData): Promise<boolean>;
}
