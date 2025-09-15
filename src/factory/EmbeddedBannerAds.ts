import {RichPartnersAds, RequestData, AdEmbeddedBannerItem, AdEmbeddedBannerData} from "../interfaces/index.js";
import {LS, WidgetManager, AdRequestService} from "../services/index.js";
import {LOCAL_STORAGE_KEYS} from "../config/index.js";
import {WidgetType} from "../types/index.js";
import {BaseAds} from "./index.js";

export class EmbeddedBannerAds extends BaseAds {
    private IMPRESSION_INTERVAL = 60;

    private config = {
        EMBEDDED_BANNER_DATA: [],
        EMBEDDED_BANNER_SSP_ID: 14263,
    };

    public getType(): string {
        return WidgetType.EMBEDDED_BANNER;
    }

    public getSsp(): number {
        return this.config.EMBEDDED_BANNER_SSP_ID;
    }

    public handleTrigger(autoRedirect: boolean): Promise<string> {
        return new Promise((resolve) => {
            resolve('success');
        });
    }

    public handle(): void {
        this.initialize();

        this.config.EMBEDDED_BANNER_DATA.forEach((item: any) => {
            item.impression_interval = this.IMPRESSION_INTERVAL;

            let elements = document.querySelectorAll(item.selector);
            if (elements.length === 0) return;

            const updatedRequestData: RequestData = {
                ...this.requestData,
                motivated: false,
                width: item.banner_width,
                height: item.banner_height,
                widget_id: this.widgetId,
                bid_floor: this.getDefaultBidFloor(),
                number_of_bids: 1,
            };

            const showAds = () => {
                this.adRequestService!.fetchAds(updatedRequestData, this.getSsp(), (data: AdEmbeddedBannerData[]) => {
                    if (data.length > 0) {
                        this.showAd(data[0], item);
                    }
                });
            };

            const hasLimits = (
                item.limit_impression_per_interval &&
                item.impression_interval &&
                item.impression_delay
            );

            if (hasLimits) {
                this.runAdCycle(showAds, item);
            } else {
                showAds();
            }
        });
    }

    private runAdCycle(callback: () => void, item: AdEmbeddedBannerItem): void {
        let count = 1;
        const startTime = Date.now();

        callback();

        const intervalId = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const withinLimit = count < item.limit_impression_per_interval!;
            const withinTime = elapsed <= item.impression_interval! * 1000;

            if (!withinLimit || !withinTime) {
                clearInterval(intervalId);
                return;
            }

            count++;
            callback();
        }, item.impression_delay! * 1000);
    }


    public showAd(ad: AdEmbeddedBannerData, item: AdEmbeddedBannerItem): void {
        const embeddedBanner = document.querySelector(item.selector);
        if (!embeddedBanner) {
            console.warn(`[showAds] Element with selector "${item.selector}" not found.`);
            return;
        }
        let embeddedBannerId = 'banner-' + Math.random().toString(36).substr(2, 9);

        embeddedBanner.innerHTML = `
                 <a href="${ad.link}" target="_blank" id="${embeddedBannerId}" class="banner-block-tg">
                    <img src="${ad.image}" alt="${item.tooltip ?? 'banner'}">
                 </a>
            `;

        if (item.tooltip?.trim()) {
            embeddedBanner.setAttribute('title', item.tooltip.trim());
        }
    }

    isConfigInstalledInLocalStorage(): boolean {
        return LS.get(LOCAL_STORAGE_KEYS.EMBEDDED_BANNER_DATA);
    }

    loadConfigByLocalStorage(): void {
        this.config.EMBEDDED_BANNER_DATA = JSON.parse(LS.get(LOCAL_STORAGE_KEYS.EMBEDDED_BANNER_DATA));
        this.config.EMBEDDED_BANNER_SSP_ID = Number(LS.get(LOCAL_STORAGE_KEYS.EMBEDDED_BANNER_SSP_ID)) || this.config.EMBEDDED_BANNER_SSP_ID;
    }

    updateConfigParams(telegramConfig: any): void {
        let customConfig = telegramConfig.widget[this.getType()];
        if (customConfig && customConfig.ssp_id) {
            this.config.EMBEDDED_BANNER_SSP_ID = customConfig.ssp_id ?? this.config.EMBEDDED_BANNER_SSP_ID;
        }

        LS.set(LOCAL_STORAGE_KEYS.EMBEDDED_BANNER_DATA, JSON.stringify([]));

        if (customConfig) {
            if (customConfig['config-banner']) {
                LS.set(LOCAL_STORAGE_KEYS.EMBEDDED_BANNER_DATA, JSON.stringify(customConfig['config-banner']));
            } else if (customConfig['config-embedded-banner']) {
                LS.set(LOCAL_STORAGE_KEYS.EMBEDDED_BANNER_DATA, JSON.stringify(customConfig['config-embedded-banner']));
            }

            if (LS.get(LOCAL_STORAGE_KEYS.EMBEDDED_BANNER_DATA)) {
                this.config.EMBEDDED_BANNER_DATA = JSON.parse(LS.get(LOCAL_STORAGE_KEYS.EMBEDDED_BANNER_DATA));
            }
        }
    }
}