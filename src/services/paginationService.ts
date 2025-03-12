import { Log } from 'crawlee';
import { TikTokApiPagination } from '../types/api.js';

export class PaginationService {
    private currentPage: number = 1;
    private totalItems: number = 0;
    private itemsPerPage: number = 0;
    private readonly log: Log;

    constructor(log: Log) {
        this.log = log;
    }

    updatePagination(pagination: TikTokApiPagination): void {
        this.currentPage = pagination.page;
        this.totalItems = pagination.total_count;
        this.itemsPerPage = pagination.size;
        
        this.log.info('Pagination updated:', {
            currentPage: this.currentPage,
            totalItems: this.totalItems,
            itemsPerPage: this.itemsPerPage
        });
    }

    getRequiredScrolls(): number {
        if (!this.totalItems || !this.itemsPerPage) {
            return 20; // Default value if no pagination data available
        }
        
        // Calculate required number of scrolls based on total items and items per page
        // Adding 1 to ensure we catch all items due to potential rounding
        return Math.ceil(this.totalItems / this.itemsPerPage);
    }

    getCurrentProgress(): { current: number; total: number } {
        return {
            current: this.currentPage,
            total: Math.ceil(this.totalItems / this.itemsPerPage)
        };
    }
}
