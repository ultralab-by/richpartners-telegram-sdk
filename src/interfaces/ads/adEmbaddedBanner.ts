export interface AdEmbeddedBannerData {
    image: string;
    link: string;
}

export interface AdEmbeddedBannerItem {
    selector: string;
    banner_width: number;
    banner_height: number;
    tooltip?: string;
    impression_interval?: number;
    impression_delay?: number;
    limit_impression_per_interval?: number;
}