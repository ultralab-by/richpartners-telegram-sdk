import {RichPartnersAds, RequestData, CapIncrementOptions} from "../../interfaces/index.js";
import {WidgetManager, AdRequestService, LS} from "../../services/index.js";

export abstract class BaseAds implements RichPartnersAds {
    protected widgetId: string | null = null;
    protected requestData: RequestData | null = null;
    protected widgetManager: WidgetManager | null = null;
    protected adRequestService: AdRequestService | null = null;

    abstract isConfigInstalledInLocalStorage(): boolean;

    abstract loadConfigByLocalStorage(): void;

    abstract updateConfigParams(config: any): void;

    abstract getType(): string;

    abstract getSsp(): number;

    abstract handle(): void;

    abstract handleTrigger(autoRedirect: boolean): Promise<string>;

    protected isNeededIgnoreClickByEvent(e: MouseEvent): boolean {
        const target = e.target as HTMLElement | null;
        if (!target) return false;

        return (
            target.id === this.getIdCloseButton() ||
            !!target.closest('.native-block-tg') ||
            !!target.closest('.banner-block-tg') ||
            !!target.closest('.telegram-interstitial-banner-close-btn') ||
            !!target.closest('.telegram-interstitial-banner-ad-overlay') ||
            !!target.closest('.telegram-interstitial-video-close-btn') ||
            !!target.closest('.telegram-interstitial-video-ad-overlay') ||
            !!target.closest('#telegram-interstitial-video-container')
        );
    }

    protected initialize() {
        this.loadConfigByLocalStorage();
        this.adRequestService = new AdRequestService(this.widgetManager!.getDebug());
        this.setWidgetId(this.widgetManager!.getWidgetIdByType(this.getType()));
        this.validate();
    }

    protected incrementCap(options: CapIncrementOptions): void {
        const {
            capKey,
            expiresCapKey,
            capIntervalKey,
            delay,
            interval,
            showedItem = 0,
        } = options;

        const previousCap = Number(LS.get(capKey)) || 0;
        let newCap = previousCap + showedItem;

        LS.set(expiresCapKey, 1, delay);

        if (LS.get(capIntervalKey) === null) {
            newCap = showedItem;
            LS.set(capIntervalKey, 1, interval);
        }

        LS.set(capKey, newCap);
    }

    protected getIdCloseButton() {
        return 'el-notification-close-btn';
    }

    protected getDefaultBidFloor(): number {
        return 0.001;
    }

    protected openAdLink(clickUrl: string | null) {
        if (!clickUrl) {
            throw new Error('clickUrl not found');
        }

        try {
            if (
                typeof window.Telegram === 'object' &&
                typeof window.Telegram.WebApp === 'object' &&
                typeof window.Telegram.WebApp.expand === 'function' &&
                typeof window.Telegram.WebApp.openLink === 'function'
            ) {
                window.Telegram.WebApp.expand();
                window.Telegram.WebApp.openLink(clickUrl);
            } else {
                const newTab = window.open(clickUrl, '_blank');

                if (newTab) {
                    newTab.focus();
                } else {
                    new Error("New tab blocked");
                }
            }
        } catch (e) {
            const newTab = window.open(clickUrl, '_blank');
            if (newTab) {
                newTab.focus();
            } else {
                new Error("New tab blocked");
            }
        }
    }

    public setWidgetId(widgetId: string | null) {
        this.widgetId = widgetId;
    }

    public setRequestData(requestData: RequestData) {
        this.requestData = requestData;
    }

    public setWidgetManager(widgetManager: WidgetManager) {
        this.widgetManager = widgetManager;
    }

    private validate() {
        if (!this.widgetManager) {
            throw new Error('widgetManager not initialized.');
        }

        if (!this.widgetId) {
            throw new Error('widgetId not initialized.');
        }
    }
}