import { RichPartnersAds } from "../interfaces";
import {
    PushStyleAds,
    EmbeddedBannerAds,
    InterstitialBannerAds,
    InterstitialVideoAds,
    BaseAds
} from "../factory/index.js";
import { WidgetType } from '../types/index.js';

export class AdsFactory {
    static createRichPartnersAdsByType(type: string): BaseAds {
        switch (type) {
            case WidgetType.PUSH_STYLE:
                return new PushStyleAds();
            case WidgetType.EMBEDDED_BANNER:
                return new EmbeddedBannerAds();
            case WidgetType.INTERSTITIAL_BANNER:
                return new InterstitialBannerAds();
            case WidgetType.INTERSTITIAL_VIDEO:
                return new InterstitialVideoAds();
            default:
                throw new Error("WidgetType not found")
        }
    }
}