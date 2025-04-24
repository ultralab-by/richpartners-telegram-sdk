export interface WidgetConfig {
    publisherId: string;
    appId: string;
    widgetTypes: Record<string, string>;
    activeWidgetTypes: string[];
    pushStyleAutoMode: boolean;
    embeddedBannerAutoMode: boolean;
    interstitialBannerAutoMode: boolean;
}