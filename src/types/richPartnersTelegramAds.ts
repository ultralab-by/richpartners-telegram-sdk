export type RichadShowFunction = (args?: unknown) => Promise<void>;

export interface TelegramAdConfig {
    pubId: string;
    appId: string;
    debug?: boolean;
}

export interface ITelegramAdsSDK {
    initialize(config: TelegramAdConfig): void;
    triggerNativeNotification(arg: boolean): Promise<void>;
}