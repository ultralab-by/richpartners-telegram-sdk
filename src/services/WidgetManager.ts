import {WidgetType, WidgetAdTypes} from '../types/index.js';
import {TelegramAdConfig} from "../interfaces/index.js";
import {LS} from "../services/index.js";
import {LOCAL_STORAGE_KEYS, CONFIG_URL, CONFIG_UPDATE_TIME} from "../config/index.js";
import {AdsFactory} from "../factory/index.js";
import CryptoJS from 'crypto-js';

export class WidgetManager {
    private publisherId: string = '';
    private appId: string = '';
    private debug: boolean = false;
    private shouldUpdateConfig: boolean = false;
    private widgetTypes: any;
    private activeWidgetTypes: WidgetAdTypes[] = [];
    private pushStyleAutoMode: any = false;
    private embeddedBannerAutoMode: any = false;
    private interstitialBannerAutoMode: any = false;
    private interstitialVideoAutoMode: any = false;
    private isPremium: any = false;

    /**
     * @param config
     */
    public initialize(config: TelegramAdConfig): void {
        this.publisherId = config.pubId;
        this.appId = config.appId;
        this.debug = config.debug ?? false;

        this.initAppSettings();
        this.initPersonalSettings();

        if (this.shouldUpdateConfig) {
            this.loadConfiguration().then((telegramConfig) => {
                this.updateAppConfigs(telegramConfig);
                this.updateWidgetConfigs(telegramConfig);
            }).catch((err) => {
                throw new Error(err.toString());
            });
        }
    }

    public async loadConfiguration() {
        const response = await fetch(this.getJsonConfigUrl(), {
            method: 'GET',
            headers: {
                accept: 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const json = await response.json();

        return json.telegram;
    }


    public getDebug(): boolean {
        return this.debug;
    }

    public getActiveWidgetTypes(): WidgetAdTypes[] {
        return this.activeWidgetTypes;
    }

    public getWidgetIdByType(widgetType: string): string | null {
        return !this.isWidgetTypeValid(widgetType) ? null : String(this.widgetTypes[widgetType])
    }

    private isWidgetTypeValid(widgetType: any) {
        return this.widgetTypes[widgetType] && this.activeWidgetTypes.includes(widgetType);
    }

    private initAppSettings = () => {
        if (this.isUploadedOldVersion()) {
            this.shouldUpdateConfig = true;
            return;
        }

        if (
            LS.getWithPrefix(LOCAL_STORAGE_KEYS.WIDGET_TYPE)
            && LS.getWithPrefix(LOCAL_STORAGE_KEYS.ACTIVE_WIDGET_TYPE)
            && LS.getWithPrefix(LOCAL_STORAGE_KEYS.CONFIG_UPDATE_TIME)
            && LS.getWithPrefix(LOCAL_STORAGE_KEYS.PUSH_STYLE_AUTO_MODE) !== undefined
            && LS.getWithPrefix(LOCAL_STORAGE_KEYS.EMBEDDED_BANNER_AUTO_MODE) !== undefined
            && LS.getWithPrefix(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_AUTO_MODE) !== undefined
            && LS.getWithPrefix(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_AUTO_MODE) !== undefined
        ) {
            this.widgetTypes = LS.getWithPrefix(LOCAL_STORAGE_KEYS.WIDGET_TYPE);
            this.activeWidgetTypes = LS.getWithPrefix(LOCAL_STORAGE_KEYS.ACTIVE_WIDGET_TYPE);
            this.pushStyleAutoMode = LS.getWithPrefix(LOCAL_STORAGE_KEYS.PUSH_STYLE_AUTO_MODE);
            this.embeddedBannerAutoMode = LS.getWithPrefix(LOCAL_STORAGE_KEYS.EMBEDDED_BANNER_AUTO_MODE);
            this.interstitialBannerAutoMode = LS.getWithPrefix(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_AUTO_MODE);
            this.interstitialVideoAutoMode = LS.getWithPrefix(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_AUTO_MODE);
            this.isPremium = LS.getWithPrefix(LOCAL_STORAGE_KEYS.IS_PREMIUM);

            return;
        }

        this.shouldUpdateConfig = true;
    }

    private initPersonalSettings = () => {
        if (!this.shouldUpdateConfig) {
            let richPartnersAds = null;

            this.activeWidgetTypes.forEach(type => {
                richPartnersAds = AdsFactory.createRichPartnersAdsByType(String(type));
                let configInstalledInLocalStorage = richPartnersAds.isConfigInstalledInLocalStorage();
                if (configInstalledInLocalStorage) {
                    richPartnersAds.loadConfigByLocalStorage();
                } else {
                    this.shouldUpdateConfig = true;
                }
            });
        }
    }

    private updateAppConfigs(config: any): void {
        let appConfig = config.app_id[this.appId];

        if (appConfig) {
            this.widgetTypes = this.transformWidgetTypes(appConfig.widgetTypes);
            this.activeWidgetTypes = [];
            this.pushStyleAutoMode = (appConfig.pushStyleAutoMode ?? false) || (appConfig.nativeAutoMode ?? false);
            this.embeddedBannerAutoMode = (appConfig.embeddedBannerAutoMode ?? false) || (appConfig.bannerAutoMode ?? false);
            this.interstitialBannerAutoMode = appConfig.embeddedBannerAutoMode ?? false;

            if (appConfig.activeWidgetTypes.includes(WidgetType.PUSH_STYLE_OLD) || appConfig.activeWidgetTypes.includes(WidgetType.PUSH_STYLE)) {
                this.activeWidgetTypes.push(WidgetType.PUSH_STYLE);
            }

            if (appConfig.activeWidgetTypes.includes(WidgetType.EMBEDDED_BANNER_OLD) || appConfig.activeWidgetTypes.includes(WidgetType.EMBEDDED_BANNER)) {
                this.activeWidgetTypes.push(WidgetType.EMBEDDED_BANNER);
            }

            if (appConfig.activeWidgetTypes.includes(WidgetType.INTERSTITIAL_BANNER)) {
                this.activeWidgetTypes.push(WidgetType.INTERSTITIAL_BANNER);
            }

            if (appConfig.activeWidgetTypes.includes(WidgetType.INTERSTITIAL_VIDEO)) {
                this.activeWidgetTypes.push(WidgetType.INTERSTITIAL_VIDEO);
            }

            LS.set(LOCAL_STORAGE_KEYS.WIDGET_TYPE, this.widgetTypes);
            LS.set(LOCAL_STORAGE_KEYS.ACTIVE_WIDGET_TYPE, this.activeWidgetTypes);
            LS.set(LOCAL_STORAGE_KEYS.PUSH_STYLE_AUTO_MODE, this.pushStyleAutoMode);
            LS.set(LOCAL_STORAGE_KEYS.EMBEDDED_BANNER_AUTO_MODE, this.embeddedBannerAutoMode);
            LS.set(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_AUTO_MODE, this.interstitialBannerAutoMode);
            LS.set(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_AUTO_MODE, this.interstitialVideoAutoMode);
            LS.set(LOCAL_STORAGE_KEYS.CONFIG_UPDATE_TIME, 1, CONFIG_UPDATE_TIME);
        }
    }

    private updateWidgetConfigs(config: any): void {
        let richPartnersAds = null;
        this.activeWidgetTypes.forEach(type => {
            richPartnersAds = AdsFactory.createRichPartnersAdsByType(String(type));
            richPartnersAds.updateConfigParams(config);
            richPartnersAds.setWidgetId(this.widgetTypes[richPartnersAds.getType()]);
        });
    }

    private transformWidgetTypes = (widgetTypes: any) => {
        const transformed = {
            PUSH_STYLE: '',
            EMBEDDED_BANNER: '',
        };

        if (widgetTypes.native || widgetTypes.banner) {
            if (widgetTypes.native) {
                transformed.PUSH_STYLE = widgetTypes.native;
            }
            if (widgetTypes.banner) {
                transformed.EMBEDDED_BANNER = widgetTypes.banner;
            }
        } else {
            Object.assign(transformed, widgetTypes);
        }

        return transformed;
    };

    private isUploadedOldVersion(): boolean {
        const activeWidgetTypes = LS.get(LOCAL_STORAGE_KEYS.ACTIVE_WIDGET_TYPE) || [];

        return activeWidgetTypes.includes(WidgetType.EMBEDDED_BANNER_OLD) || activeWidgetTypes.includes(WidgetType.PUSH_STYLE_OLD)
    }

    private getJsonConfigUrl(): string {
        const hash = CryptoJS.MD5(String(this.publisherId));
        return CONFIG_URL + hash + '.json';
    }
}

