export interface AdRequestPayload {
    ip: string;
    user_agent: string;
    publisher_id: string;
    language_code: string;
    widget_id: string;
    telegram_id: string;
    bid_floor: number;
    number_of_bids: number;
    blocked_categories?: number[];
    premium: boolean;
    motivated: boolean;
    width?: number;
    height?: number;
    production: boolean;
}