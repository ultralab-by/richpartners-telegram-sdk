import {TelegramAdConfig, RequestData, TelegramData, RichPartnersAds, ITelegramAdsSDK} from "../interfaces/index.js";
import {WidgetManager, IpService, TelegramService, injectRichPartnersStylesheet, TW} from "../services/index.js";
import {AdsFactory} from "../factory/index.js";
import {WidgetType} from "../types/index.js";

export class RichPartnersTelegramAds implements ITelegramAdsSDK{
    private requestData: RequestData = {};
    private telegramData: TelegramData = {};
    private widgetManager: WidgetManager;
    private debug: boolean;
    private appId: string | null = null;
    private telegramService: TelegramService;
    private ipService: IpService;

    constructor() {
        this.debug = false;
        this.widgetManager = new WidgetManager();
        this.telegramService = new TelegramService();
        this.ipService = new IpService();
    }

    public async initialize(config: TelegramAdConfig): Promise<void> {
        try {
            this.appId = config.appId;
            this.debug = config.debug ?? false;
            this.requestData.publisher_id = config.pubId;
            this.requestData.user_agent = navigator.userAgent;
            this.telegramData = this.telegramService.getTelegramData(this.debug);
            Object.assign(this.requestData, this.telegramData);
            injectRichPartnersStylesheet();

            this.widgetManager.initialize(config);

            this.ipService.setIp().then(() => {
                this.requestData.ip = this.ipService.getIp()
                this.process();
            }).catch(console.error);

        } catch (error) {
            console.warn("[TelegramAdsController] Failed initialized:", error);
        }
    }

    private process = () => {
        const activeWidgetTypes = this.widgetManager.getActiveWidgetTypes();
        let richPartnersAds = null;
        activeWidgetTypes.forEach(type => {
            richPartnersAds = AdsFactory.createRichPartnersAdsByType(String(type));
            richPartnersAds.setRequestData(this.requestData);
            richPartnersAds.setWidgetManager(this.widgetManager);
            richPartnersAds.handle();
        });

        if (this.telegramData?.telegram_id) {
            TW.handle(this.telegramData.telegram_id);
        }
    }

    async triggerPushStyle(autoRedirect = false): Promise<string> {
        return this.triggerByWidgetType(WidgetType.PUSH_STYLE, autoRedirect);
    }

    async triggerInterstitialBanner(autoRedirect = false): Promise<string> {
        return this.triggerByWidgetType(WidgetType.INTERSTITIAL_BANNER, autoRedirect);
    }

    async triggerInterstitialVideo(autoRedirect = false): Promise<string> {
        return this.triggerByWidgetType(WidgetType.INTERSTITIAL_VIDEO, autoRedirect);
    }

    private async triggerByWidgetType(type: WidgetType, autoRedirect: boolean): Promise<string> {
        try {
            if (!this.requestData.ip) {
                await this.ipService.setIp();
            }

            const richPartnersAds = AdsFactory.createRichPartnersAdsByType(type);
            richPartnersAds.setRequestData(this.requestData);
            richPartnersAds.setWidgetManager(this.widgetManager);

            const widgetId = this.widgetManager.getWidgetIdByType(type);

            if (!widgetId) {
                return Promise.reject(new Error("widget_id not initialize"));
            }

            return richPartnersAds.handleTrigger(autoRedirect);
        } catch (error) {
            return Promise.reject(error);
        }
    }
}
