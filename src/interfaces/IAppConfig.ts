export interface IAppConfig {
    pubId: string;
    appId: string;
    debug?: boolean;
    onReward?: () => void;
    onError?: (error: unknown) => void;
}