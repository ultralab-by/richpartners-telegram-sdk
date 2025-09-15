export interface AppConfig {
    pubId: string;
    appId: string;
    debug?: boolean;
    onReward?: () => void;
    onError?: (error: unknown) => void;
}