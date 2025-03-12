export interface TikTokApiPagination {
    has_more: boolean;
    page: number;
    size: number;
    total_count: number;
}

export interface TikTokAdMaterial {
    ad_title: string;
    brand_name: string;
    cost: number;
    ctr: number;
    favorite: boolean;
    id: string;
    industry_key: string;
    is_search: boolean;
    like: number;
    objective_key: string;
    tag: number;
    video_info: {
        vid: string;
        duration: number;
        cover: string;
        video_url: {
            '360p': string;
            '480p': string;
            '720p': string;
        };
        width: number;
        height: number;
    };
}

export interface TikTokApiResponse {
    code: number;
    msg: string;
    request_id: string;
    data: {
        materials: TikTokAdMaterial[];
        pagination: TikTokApiPagination;
    };
}
