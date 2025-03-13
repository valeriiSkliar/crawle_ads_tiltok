import { IDatabase } from '@src/services/database/types.js';
import type { AdData, DatabaseConfig } from '@src/services/database/types.js';
import { prisma } from '../prisma/client.js';
import type { Prisma, Ad, VideoInfo, VideoUrl } from '@prisma/client';

/**
 * Prisma implementation of the IDatabase interface.
 * Provides type-safe database operations using Prisma ORM.
 */
export class PrismaDatabase implements IDatabase {
    constructor(config: DatabaseConfig) {
        // Prisma uses DATABASE_URL from environment
        if (!config.connectionString && !process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is required. Please provide a valid connection string in the config.');
        }
        
        // Set the connection string for Prisma if provided in config
        if (config.connectionString) {
            process.env.DATABASE_URL = config.connectionString;
        }
    }

    async connect(): Promise<void> {
        await prisma.$connect();
    }

    async disconnect(): Promise<void> {
        await prisma.$disconnect();
    }

    async query<T>(sql: string, params?: unknown[]): Promise<T> {
        return prisma.$queryRawUnsafe(sql, ...(params || [])) as Promise<T>;
    }

    async checkDuplicate(key: string): Promise<boolean> {
        const result = await prisma.processedItem.findUnique({
            where: { itemKey: key }
        });
        return !!result;
    }

    async insertAd(data: AdData): Promise<void> {
        try {
            // Insert video info if provided
            if (data.videoInfo) {
                // Check if video info already exists
                const existingVideoInfo = await prisma.videoInfo.findUnique({
                    where: { vid: data.videoInfo.vid }
                });

                if (!existingVideoInfo) {
                    if (data.videoInfo.videoUrl) {
                        // Create video info with URL
                        await prisma.videoInfo.create({
                            data: {
                                vid: data.videoInfo.vid,
                                duration: data.videoInfo.duration,
                                cover: data.videoInfo.cover,
                                width: data.videoInfo.width,
                                height: data.videoInfo.height,
                                videoUrl: {
                                    create: {
                                        p720: data.videoInfo.videoUrl.p720
                                    }
                                }
                            }
                        });
                    } else {
                        // Create video info without URL
                        await prisma.videoInfo.create({
                            data: {
                                vid: data.videoInfo.vid,
                                duration: data.videoInfo.duration,
                                cover: data.videoInfo.cover,
                                width: data.videoInfo.width,
                                height: data.videoInfo.height
                            }
                        });
                    }
                }
            }

            // Insert ad
            await prisma.ad.create({
                data: {
                    id: data.id,
                    countryCode: data.countryCode,
                    creativeId: data.creativeId,
                    advertiserId: data.advertiserId,
                    advertiserName: data.advertiserName,
                    metadata: data.metadata,
                    ...(data.videoInfo && {
                        videoInfo: {
                            connect: { vid: data.videoInfo.vid }
                        }
                    }),
                    createdAt: data.createdAt ?? new Date(),
                    updatedAt: data.updatedAt ?? new Date()
                }
            });

            // Mark item as processed
            await prisma.processedItem.create({
                data: {
                    itemKey: data.id
                }
            });
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to insert ad: ${error.message}`);
            }
            throw error;
        }
    }

    async findAdById(id: string): Promise<AdData | null> {
        const ad = await prisma.ad.findUnique({
            where: { id },
            include: {
                videoInfo: {
                    include: {
                        videoUrl: true
                    }
                }
            }
        });

        if (!ad) return null;

        return this.mapPrismaAdToAdData(ad);
    }

    async findAdByCreativeId(id: string): Promise<AdData | null> {
        const ad = await prisma.ad.findFirst({
            where: { creativeId: id },
            include: {
                videoInfo: {
                    include: {
                        videoUrl: true
                    }
                }
            }
        });

        if (!ad) return null;

        return this.mapPrismaAdToAdData(ad);
    }

    async exists(criteria: Partial<AdData>): Promise<boolean> {
        const where: Prisma.AdWhereInput = {};

        if (criteria.id) where.id = criteria.id;
        if (criteria.creativeId) where.creativeId = criteria.creativeId;
        if (criteria.advertiserId) where.advertiserId = criteria.advertiserId;
        if (criteria.countryCode) where.countryCode = criteria.countryCode;

        const count = await prisma.ad.count({ where });
        return count > 0;
    }

    async isDuplicate(data: AdData): Promise<boolean> {
        // Check if ad with same ID or creativeId already exists
        return this.exists({
            id: data.id,
            creativeId: data.creativeId
        });
    }

    private mapPrismaAdToAdData(ad: Ad & {
        videoInfo?: (VideoInfo & {
            videoUrl?: VideoUrl | null;
        }) | null;
    }): AdData {
        return {
            id: ad.id,
            countryCode: ad.countryCode,
            creativeId: ad.creativeId,
            advertiserId: ad.advertiserId,
            advertiserName: ad.advertiserName,
            metadata: ad.metadata as Prisma.InputJsonValue,
            ...(ad.videoInfo && {
                videoInfo: {
                    vid: ad.videoInfo.vid,
                    duration: ad.videoInfo.duration,
                    cover: ad.videoInfo.cover,
                    width: ad.videoInfo.width,
                    height: ad.videoInfo.height,
                    ...(ad.videoInfo.videoUrl && {
                        videoUrl: {
                            p720: ad.videoInfo.videoUrl.p720
                        }
                    })
                }
            }),
            createdAt: ad.createdAt,
            updatedAt: ad.updatedAt
        };
    }
}