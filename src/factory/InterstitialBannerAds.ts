import {AdInterstitialBanner, adPushStyleData, CapIncrementOptions, RequestData} from "../interfaces/index.js";
import {LS} from "../services/index.js";
import {LOCAL_STORAGE_KEYS} from "../config/index.js";
import {WidgetType} from '../types/index.js';
import {BaseAds} from "./index.js";

export class InterstitialBannerAds extends BaseAds {
    private waitShowed: boolean = false;
    private config = {
        INTERSTITIAL_BANNER_IMPRESSION_DELAY: 15,
        INTERSTITIAL_BANNER_IMPRESSION_INTERVAL: 86400,
        INTERSTITIAL_BANNER_LIMIT_IMPRESSION_PER_INTERVAL: 20,
        INTERSTITIAL_BANNER_RESTART_LIMIT_IMPRESSIONS: false,
        INTERSTITIAL_BANNER_CLOSABLE_WITHOUT_VIEW: true,
        INTERSTITIAL_BANNER_SSP_ID: 14657,
        INTERSTITIAL_BANNER_AD_DURATION: 10,
        INTERSTITIAL_BANNER_WIDTH: 1,
        INTERSTITIAL_BANNER_HEIGHT: 1,

    };

    public getSsp(): number {
        return this.config.INTERSTITIAL_BANNER_SSP_ID;
    }

    getType(): string {
        return WidgetType.INTERSTITIAL_BANNER;
    }

    public handleTrigger(autoRedirect: boolean): Promise<string> {
        return new Promise((resolve, reject) => {
            this.initialize();

            const updatedRequestData: RequestData = {
                ...this.requestData,
                motivated: true,
                widget_id: this.widgetId,
                bid_floor: this.getDefaultBidFloor(),
                width: this.config.INTERSTITIAL_BANNER_WIDTH,
                height: this.config.INTERSTITIAL_BANNER_HEIGHT,
                number_of_bids: 1,
            };

            this.adRequestService!.fetchAds(updatedRequestData, this.getSsp(), (data: adPushStyleData[]) => {
                if (data.length === 0) {
                    reject(new Error('Ads not found'));
                }
                this.displayInterstitialBannerAds(data);
                this.startTimer(this.config.INTERSTITIAL_BANNER_AD_DURATION);

                const interstitialBanner = document.querySelector('.telegram-interstitial-banner-ad-overlay') as HTMLElement | null;

                if (autoRedirect && interstitialBanner) {
                    const image = interstitialBanner.querySelector('.telegram-interstitial-banner-ad-image') as HTMLElement | null;
                    const adLink = interstitialBanner.querySelector('.telegram-interstitial-banner-ad-content-link') as HTMLLinkElement | null;

                    if (image && adLink && adLink.href) {
                        image.onload = () => {
                            const container = document.getElementById('telegram-interstitial-banner-content') as HTMLElement | null;
                            container!.remove();

                            try {
                                this.openAdLink(adLink.href);
                                resolve('success');
                            } catch (e) {
                                reject(new Error("New tab blocked"));
                            }
                        };
                    } else {
                        reject(new Error("Missing ad image or link"));
                    }
                }

                document.addEventListener('click', function (event) {
                    const target = (event.target as HTMLElement).closest('.telegram-interstitial-banner-ad-overlay');
                    if (target) {
                        resolve('success');
                    }
                });

            }).catch(reject);
        });
    }

    public handle(): void {
        this.initialize();

        const updatedRequestData: RequestData = {
            ...this.requestData,
            motivated: false,
            widget_id: this.widgetId,
            bid_floor: this.getDefaultBidFloor(),
            width: this.config.INTERSTITIAL_BANNER_WIDTH,
            height: this.config.INTERSTITIAL_BANNER_HEIGHT,
            number_of_bids: 1,
        };

        document.addEventListener('click', (e) => {
            if (this.isNeededIgnoreClickByEvent(e)) {
                return;
            }

            if (this.isNeedFetchAds()) {
                this.waitShowed = true;
                this.adRequestService!.fetchAds(updatedRequestData, this.getSsp(), (data: AdInterstitialBanner[]) => {
                    if (data.length > 0) {
                        this.displayInterstitialBannerAds(data);
                        this.incrementInterstitialBannerCap(data.length);
                    }

                    this.waitShowed = false;
                });
            }
        });
    }

    private isCapped() {
        if (this.waitShowed) {
            return true;
        }

        let notificationLimit = Math.floor(LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_CAP)) ?? 0;

        return (this.config.INTERSTITIAL_BANNER_LIMIT_IMPRESSION_PER_INTERVAL <= notificationLimit) || LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_EXPIRES_CAP) === 1;
    }

    private incrementInterstitialBannerCap(showedItem: number = 0) {
        const capOptions: CapIncrementOptions = {
            capKey: LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_CAP,
            expiresCapKey: LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_EXPIRES_CAP,
            capIntervalKey: LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_CAP_PER_INTERVAL,
            delay: this.config.INTERSTITIAL_BANNER_IMPRESSION_DELAY,
            interval: this.config.INTERSTITIAL_BANNER_LIMIT_IMPRESSION_PER_INTERVAL,
            showedItem: showedItem,
        };

        this.incrementCap(capOptions);
    }

    private isNeedFetchAds(): boolean {
        return this.widgetManager?.getDebug() === true || !this.isCapped();
    }

    private displayInterstitialBannerAds(data: any) {
        if (data.length > 0) {
            this.getOrCreateInterstitialBannerContainer();
        }
        data.forEach((item: AdInterstitialBanner) => {
            this.showInterstitialBannerAds(item);
        });
    }

    private getOrCreateInterstitialBannerContainer() {
        const existingInterstitialBanner = document.getElementById('telegram-interstitial-banner-content');
        existingInterstitialBanner?.remove();

        const interstitialBannerBlock = document.createElement('div');
        const closeBlock = document.createElement('div');

        interstitialBannerBlock.id = 'telegram-interstitial-banner-content';
        interstitialBannerBlock.className = 'telegram-interstitial-banner-container';

        if (this.config.INTERSTITIAL_BANNER_CLOSABLE_WITHOUT_VIEW) {
            closeBlock.id = this.getIdCloseButton();
            closeBlock.className = 'telegram-interstitial-banner-close-btn';
            closeBlock.addEventListener('click', () => interstitialBannerBlock.remove());
            interstitialBannerBlock.appendChild(closeBlock);
        }

        document.body.appendChild(interstitialBannerBlock);

        return interstitialBannerBlock;
    }

    private startTimer(totalSeconds: number) {
        let closeButton = document.querySelector(".telegram-interstitial-banner-close-btn") as HTMLElement | null;
        let timerElement = document.querySelector(".telegram-interstitial-banner-timer") as HTMLElement | null;
        timerElement!.style.display = "block";
        closeButton!.style.display = "none";

        function updateTimerDisplay(secondsLeft: number) {
            let minutes = Math.floor(secondsLeft / 60);
            let seconds = secondsLeft % 60;
            timerElement!.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        let timeLeft = totalSeconds;
        updateTimerDisplay(timeLeft);

        let countdown = setInterval(function () {
            timeLeft--;
            updateTimerDisplay(timeLeft);

            if (timeLeft <= 0) {
                clearInterval(countdown);
                timerElement!.style.display = "none";
                closeButton!.style.display = "flex";
            }
        }, 1000);
    }

    private showInterstitialBannerAds(adInterstitialBanner: AdInterstitialBanner) {
        const container = document.getElementById('telegram-interstitial-banner-content');
        if (!container) {
            throw new Error('Container telegram-notification-content not found.');
        }

        const interstitialBanner = document.createElement('div');
        let interstitialBannerId = 'interstitial-banner-' + Math.random().toString(36).substr(2, 9);
        interstitialBanner.innerHTML = `
                <div class="telegram-interstitial-banner-ad-overlay" id="${interstitialBannerId}">
                    <div class="telegram-interstitial-banner-timer"></div>
                    <div class="telegram-interstitial-banner-ad-container">
                        <img src="${adInterstitialBanner.icon}" class="telegram-interstitial-banner-icon" alt="telegram-interstitial-banner-avatar">
                        <a class="telegram-interstitial-banner-ad-content-link" href="${adInterstitialBanner.link}" target="_blank">
                             <div class="telegram-interstitial-banner-ad-block">
                                <img src="${adInterstitialBanner.banner}" class="telegram-interstitial-banner-ad-image" alt="telegram-interstitial-banner-banner">
                                <div class="telegram-interstitial-banner-ad-header">
                                    <p class="telegram-interstitial-banner-ad-title">${adInterstitialBanner.title}</p>
                                </div>
                                <div class="telegram-interstitial-banner-ad-message">
                                     <p>${adInterstitialBanner.message}</p>
                                </div>
                                 <div class="telegram-interstitial-banner-ad-brand">
                                     <p>${adInterstitialBanner.brand}</p>
                                 </div>
                              
                               
                                <div class="telegram-interstitial-banner-ad-tail"></div>
                             </div>
                             <div class="telegram-interstitial-banner-ad-button">${adInterstitialBanner.button}</div>
                        </a>
                    </div>
                </div>
            `;

        container.appendChild(interstitialBanner);
        const adContent = document.querySelector('.telegram-interstitial-banner-ad-content-link');

        if (!adContent) {
            throw new Error('element telegram-interstitial-banner-ad-content-link not found.');
        }

        adContent.addEventListener('click', (event) => {
            container.remove();
        });
    }

    isConfigInstalledInLocalStorage(): boolean {
        return (
            LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_IMPRESSION_DELAY)
            && LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_IMPRESSION_INTERVAL)
            && LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_LIMIT_IMPRESSION_PER_INTERVAL)
            && LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_WIDTH)
            && LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_HEIGHT)
            && LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_AD_DURATION)
            && LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_SSP_ID)
            && LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_RESTART_LIMIT_IMPRESSIONS) !== undefined
            && LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_CLOSABLE_WITHOUT_VIEW) !== undefined);
    }

    loadConfigByLocalStorage(): void {
        this.config.INTERSTITIAL_BANNER_IMPRESSION_DELAY = Number(LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_IMPRESSION_DELAY));
        this.config.INTERSTITIAL_BANNER_IMPRESSION_INTERVAL = Number(LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_IMPRESSION_INTERVAL));
        this.config.INTERSTITIAL_BANNER_LIMIT_IMPRESSION_PER_INTERVAL = Number(LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_LIMIT_IMPRESSION_PER_INTERVAL));
        this.config.INTERSTITIAL_BANNER_RESTART_LIMIT_IMPRESSIONS = LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_RESTART_LIMIT_IMPRESSIONS) === 'true';
        this.config.INTERSTITIAL_BANNER_CLOSABLE_WITHOUT_VIEW = LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_CLOSABLE_WITHOUT_VIEW);
        this.config.INTERSTITIAL_BANNER_SSP_ID = Number(LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_SSP_ID));
        this.config.INTERSTITIAL_BANNER_AD_DURATION = Number(LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_AD_DURATION));
        this.config.INTERSTITIAL_BANNER_WIDTH = Number(LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_WIDTH));
        this.config.INTERSTITIAL_BANNER_HEIGHT = Number(LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_HEIGHT));
    }

    updateConfigParams(telegramConfig: any): void {
        let customConfig = telegramConfig.widget[this.getType()];
        if (customConfig) {
            if (customConfig.ssp_id) {
                this.config.INTERSTITIAL_BANNER_SSP_ID = customConfig.ssp_id ?? this.config.INTERSTITIAL_BANNER_SSP_ID;
            }

            if ('config-interstitial-banner' in customConfig) {
                let item = customConfig['config-interstitial-banner'];
                this.config.INTERSTITIAL_BANNER_IMPRESSION_DELAY = Number(item.impression_delay);
                this.config.INTERSTITIAL_BANNER_IMPRESSION_INTERVAL = Number(item.impression_interval);
                this.config.INTERSTITIAL_BANNER_LIMIT_IMPRESSION_PER_INTERVAL = Number(item.limit_impression_per_interval);
                this.config.INTERSTITIAL_BANNER_RESTART_LIMIT_IMPRESSIONS = item.restart_limit_impressions;
                this.config.INTERSTITIAL_BANNER_CLOSABLE_WITHOUT_VIEW = item.closable_without_view_available ?? this.config.INTERSTITIAL_BANNER_CLOSABLE_WITHOUT_VIEW;
                this.config.INTERSTITIAL_BANNER_AD_DURATION = Number(item.ad_duration)
                this.config.INTERSTITIAL_BANNER_WIDTH = Number(item.banner_width)
                this.config.INTERSTITIAL_BANNER_HEIGHT = Number(item.banner_height)
            }
        }

        this.setLocalStorageConfig();
    }

    setLocalStorageConfig(): void {
        LS.set(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_IMPRESSION_INTERVAL, this.config.INTERSTITIAL_BANNER_IMPRESSION_INTERVAL);
        LS.set(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_IMPRESSION_DELAY, this.config.INTERSTITIAL_BANNER_IMPRESSION_DELAY);
        LS.set(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_LIMIT_IMPRESSION_PER_INTERVAL, this.config.INTERSTITIAL_BANNER_LIMIT_IMPRESSION_PER_INTERVAL);
        LS.set(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_RESTART_LIMIT_IMPRESSIONS, this.config.INTERSTITIAL_BANNER_RESTART_LIMIT_IMPRESSIONS);
        LS.set(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_SSP_ID, this.config.INTERSTITIAL_BANNER_SSP_ID);
        LS.set(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_CLOSABLE_WITHOUT_VIEW, this.config.INTERSTITIAL_BANNER_CLOSABLE_WITHOUT_VIEW);
        LS.set(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_AD_DURATION, this.config.INTERSTITIAL_BANNER_AD_DURATION);
        LS.set(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_WIDTH, this.config.INTERSTITIAL_BANNER_WIDTH);
        LS.set(LOCAL_STORAGE_KEYS.INTERSTITIAL_BANNER_HEIGHT, this.config.INTERSTITIAL_BANNER_HEIGHT);
    }
}