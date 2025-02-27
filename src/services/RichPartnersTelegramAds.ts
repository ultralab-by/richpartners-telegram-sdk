import { TelegramAdConfig, ITelegramAdsSDK } from "../types/richPartnersTelegramAds";
import { personalData } from "../types/personalData";
import { telegramData } from "../types/telegramData";

export class RichPartnersTelegramAds {
    public sdk?: ITelegramAdsSDK;
    private personalData: personalData = {};
    private telegramData: telegramData = {};
    private debug: boolean;
    private triggerNativeNotification?: (arg: boolean) => Promise<void>;
    private appId: string;


    constructor() {
        this.debug = false;
        this.appId = '';
    }

    /**
     * init RichPartners SDK Telegram Ads.
     * @param config
     */
    public async initialize(config: TelegramAdConfig): Promise<void> {
        try {
            this.personalData.publisher_id = config.pubId;
            this.personalData.user_agent = config.pubId;
            this.appId = config.appId;
            this.debug = config.debug ?? false;
            this.initTelegramData();

        } catch (error) {

            console.warn("[TelegramAdsController] Ошибка инициализации:", error);
        }
    }

    public async showAd(): Promise<void> {
        // if (!this.triggerNativeNotification) {
        //     console.error("TelegramAdsController не инициализирован.");
        //     return;
        // }
        //
        // try {
        //     await this.triggerNativeNotification(true);
        // } catch (error) {
        //     console.error("Ошибка при показе рекламы:", error);
        // }
    }

    private initTelegramData(): void {
        if (typeof window === 'undefined') {
            throw new Error("RichPartnersTelegramAds can only be called in a browser environment.");
        }

        if (this.debug) {
            this.telegramData = {
                telegram_id: '123456789',
                language_code: 'en',
                premium: false,
                last_name: '',
                firstName: 'publisher',
                version: '8.0',
                platform: 'weba',
            }

            return;
        }

        console.log(1);
        // const tg = {initDataUnsafe};

        // if (tg.initDataUnsafe.user === undefined) {
        //     console.log('telegram user not found.');
        //     return;
        // }

        // this.telegramData = {
        //     telegram_id: String(tg.initDataUnsafe.user.id),
        //     language_code: tg.initDataUnsafe.user.language_code,
        //     premium: tg.initDataUnsafe.user.is_premium || false,
        //     last_name: tg.initDataUnsafe.user.last_name || '',
        //     firstName: tg.initDataUnsafe.user.first_name,
        //     version: tg.version,
        //     platform: tg.platform,
        // }
    }
}
