export type RichadShowFunction = (args?: unknown) => Promise<void>;

export interface TelegramAdConfig {
    pubId: string;
    appId: string;
    debug?: boolean;
}

export interface ITelegramAdsSDK {
    initialize(config: TelegramAdConfig): void;
    triggerPushStyle(arg: boolean): Promise<string>;
    triggerInterstitialBanner(arg: boolean): Promise<string>;
    triggerInterstitialVideo(arg: boolean): Promise<string>;
}