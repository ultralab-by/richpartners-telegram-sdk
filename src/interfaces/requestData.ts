export interface RequestData {
    publisher_id?: string;
    user_agent?: string;
    source_id?: string;
    telegram_id?: string;
    language_code?: string;
    premium?: boolean;
    last_name?: string;
    firstName?: string;
    version?: string;
    platform?: string;
    motivated?: boolean;
    bid_floor?: number;
    number_of_bids?: number;
    widget_id?: string | null;
    width?: number;
    height?: number;
    ip?: string;
}