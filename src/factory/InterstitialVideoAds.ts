import {
    AdInterstitialBanner,
    AdInterstitialVideo, adPushStyleData,
    CapIncrementOptions,
    RequestData,
    RichPartnersAds
} from "../interfaces";
import {LS, WidgetManager} from "../services/index.js";
import {LOCAL_STORAGE_KEYS} from "../config/index.js";
import { WidgetType } from '../types/index.js';
import {BaseAds} from "./index.js";


export class InterstitialVideoAds extends BaseAds {
    private waitShowed: boolean = false;
    private isPause: boolean = false;
    private videoLink: string | null = null;
    private config = {
        INTERSTITIAL_VIDEO_IMPRESSION_DELAY: 30,
        INTERSTITIAL_VIDEO_IMPRESSION_INTERVAL: 86400,
        INTERSTITIAL_VIDEO_LIMIT_IMPRESSION_PER_INTERVAL: 20,
        INTERSTITIAL_VIDEO_RESTART_LIMIT_IMPRESSIONS: false,
        INTERSTITIAL_VIDEO_CLOSABLE_WITHOUT_VIEW: false,
        INTERSTITIAL_VIDEO_SSP_ID: 14862,
        INTERSTITIAL_VIDEO_AD_DURATION: 10,
    };

    public getSsp(): number {
        return this.config.INTERSTITIAL_VIDEO_SSP_ID;
    }

    getType(): string {
        return WidgetType.INTERSTITIAL_VIDEO;
    }

    getConfigTypeName(): string {
        return 'config-interstitial-video';
    }

    public handleTrigger(autoRedirect: boolean): Promise<string> {
        return new Promise((resolve, reject) => {
            this.initialize();

            const updatedRequestData: RequestData = {
                ...this.requestData,
                motivated: true,
                widget_id: this.widgetId,
                bid_floor: this.getDefaultBidFloor(),
                number_of_bids: 1,
            };

            this.adRequestService!.fetchAds(updatedRequestData, this.getSsp(), (data: adPushStyleData[]) => {
                if (data.length === 0) {
                    reject(new Error('Ads not found'));
                }
                this.displayInterstitialVideoAds(data);

                document.addEventListener('click', function (event) {
                    const target =  (event.target as HTMLElement).closest('.telegram-interstitial-video-ad-overlay');
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
                        this.displayInterstitialVideoAds(data);
                        this.incrementInterstitialBannerCap(data.length);
                    }

                    this.waitShowed = false;
                });
            }
        });
    }

    private displayInterstitialVideoAds(data: any) {
        if (data.length > 0) {
            this.getOrCreateInterstitialVideoContainer();
        }
        data.forEach((item: AdInterstitialVideo) => {
            this.showInterstitialVideoAds(item);
        });
    }

    private getOrCreateInterstitialVideoContainer() {
        const existingInterstitialBanner = document.getElementById('telegram-interstitial-video-content');
        existingInterstitialBanner?.remove();

        const interstitialVideoBlock = document.createElement('div');
        const closeBlock = document.createElement('div');

        interstitialVideoBlock.id = 'telegram-interstitial-video-content';
        interstitialVideoBlock.className = 'telegram-interstitial-video-container';

        closeBlock.id = this.getIdCloseButton();
        closeBlock.className = 'telegram-interstitial-video-close-btn';
        closeBlock.addEventListener('click', () => interstitialVideoBlock.remove());
        closeBlock.style.display = 'none';
        interstitialVideoBlock.appendChild(closeBlock);

        document.body.appendChild(interstitialVideoBlock);

        return interstitialVideoBlock;
    }

    showInterstitialVideoAds(adInterstitialVideo: AdInterstitialVideo) {
        const container = document.getElementById('telegram-interstitial-video-content');

        if (!container) {
            throw new Error('Container telegram-interstitial-video-content not found.');
        }

        const interstitialVideo = document.createElement('div');
        let interstitialVideoId = 'interstitial-video-' + Math.random().toString(36).substr(2, 9);
        let countdown = this.config.INTERSTITIAL_VIDEO_AD_DURATION;
        this.videoLink = adInterstitialVideo.link;

        interstitialVideo.innerHTML = `
                <div class="telegram-interstitial-video-ad-overlay" id="${interstitialVideoId}">
                    <div id="videoTimer" class="telegram-interstitial-video-timer">10</div>
                    <div class="telegram-interstitial-video-ad-container">
                        <img src="${adInterstitialVideo.icon}" class="telegram-interstitial-video-icon" alt="telegram-interstitial-video-avatar">
                        <div class="telegram-interstitial-video-ad-content-link">
                             <div class="telegram-interstitial-video-ad-block">
                                 <div class="telegram-interstitial-video-block">
                                      <video id="adVideo" class="telegram-interstitial-video-ad-image" playsinline muted autoplay>
                                            <source src="${adInterstitialVideo.video}" type="video/mp4">
                                        </video>
                                        <div id="videoPlaceholder" class="video-placeholder">
                                           <button id="playButton">▶</button>
                                        </div>
                                        <button id="muteToggle" class="video-mute-button">🔇</button>
                                 </div>

                                <div class="telegram-interstitial-video-ad-header">
                                    <p class="telegram-interstitial-video-ad-title">${adInterstitialVideo.title}</p>
                                </div>
                                <div class="telegram-interstitial-video-ad-message">
                                     <p>${adInterstitialVideo.message}</p>
                                </div>
                                 <button id="closeAd" disabled> Close in ${countdown}</button>
                                 <div class="telegram-interstitial-video-ad-tail"></div>
                             </div>
                             <div class="telegram-interstitial-video-ad-button">${adInterstitialVideo.button}</div>
                        </div>
                    </div>
                </div>
            `;

        container.appendChild(interstitialVideo);


        let videoBlock = document.getElementById('adVideo') as HTMLVideoElement | null;
        const muteToggle = document.getElementById('muteToggle') as HTMLElement | null;
        const closeAdButton = document.getElementById('closeAd') as HTMLElement | null;
        const videoPlaceholder = document.getElementById('videoPlaceholder') as HTMLElement | null;
        const timerElement = document.getElementById('videoTimer') as HTMLElement | null;
        const closeButton = document.querySelector('.telegram-interstitial-video-close-btn') as HTMLElement | null;
        const videoAdButton = document.querySelector('.telegram-interstitial-video-ad-button');

        const timer = setInterval(() => {
            if (this.isPause) {
                return;
            }
            countdown--;
            timerElement!.textContent = countdown.toString();
            closeAdButton!.textContent = `Close in ${countdown}`;

            if (countdown <= 0) {
                clearInterval(timer);
                closeAdButton!.style.display = 'none';
                closeButton!.style.display = 'flex';
            }

        }, 1000);

        if (videoBlock)  {
            muteToggle!.addEventListener('click', () => {

                videoBlock!.muted = !videoBlock.muted;
                muteToggle!.textContent = videoBlock!.muted ? '🔇' : '🔊';
            });

            closeAdButton!.addEventListener('click', () => {
                container.remove();
            });

            videoAdButton!.addEventListener('click', () => {
                this.openAdLink(this.videoLink);

                if (countdown <= 0) {
                    container.remove();
                }
            });

            videoBlock.play().then(r => {
                videoPlaceholder!.style.display = 'none';
            }).catch(() => console.log("Autoplay disabled"));


            videoBlock.addEventListener("click", this.togglePlayPause);
            videoPlaceholder!.addEventListener("click", this.togglePlayPause);
        }
    }

    togglePlayPause = () => {
        let videoBlock = document.getElementById('adVideo') as HTMLVideoElement | null;;
        const videoPlaceholder = document.getElementById('videoPlaceholder') as HTMLElement | null;

        if (videoBlock!.paused) {
            videoBlock!.play();
            this.isPause = false;
            videoPlaceholder!.style.display = 'none';
        } else {
            videoBlock!.pause();
            this.isPause = true;
            videoPlaceholder!.style.display = 'block';
            this.openAdLink(this.videoLink);
        }
    }

    private isCapped() {
        if (this.waitShowed) {
            return true;
        }

        let notificationLimit = Math.floor(LS.get(LOCAL_STORAGE_KEYS.PUSH_STYLE_CAP)) ?? 0;

        return (this.config.INTERSTITIAL_VIDEO_LIMIT_IMPRESSION_PER_INTERVAL <= notificationLimit) || LS.get(LOCAL_STORAGE_KEYS.PUSH_STYLE_EXPIRES_CAP) === 1;
    }

    private isNeedFetchAds(): boolean {
        return this.widgetManager?.getDebug() === true || !this.isCapped();
    }

    private incrementInterstitialBannerCap(showedItem: number = 0) {
        const capOptions: CapIncrementOptions = {
            capKey: LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_CAP,
            expiresCapKey: LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_EXPIRES_CAP,
            capIntervalKey: LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_CAP_PER_INTERVAL,
            delay: this.config.INTERSTITIAL_VIDEO_IMPRESSION_DELAY,
            interval: this.config.INTERSTITIAL_VIDEO_LIMIT_IMPRESSION_PER_INTERVAL,
            showedItem: showedItem,
        };

        this.incrementCap(capOptions);
    }

    isConfigInstalledInLocalStorage(): boolean {
        return (
            LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_IMPRESSION_DELAY)
            && LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_IMPRESSION_INTERVAL)
            && LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_LIMIT_IMPRESSION_PER_INTERVAL)
            && LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_AD_DURATION)
            && LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_SSP_ID)
            && LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_RESTART_LIMIT_IMPRESSIONS) !== undefined
            && LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_CLOSABLE_WITHOUT_VIEW) !== undefined);
    }

    loadConfigByLocalStorage(): void {
        this.config.INTERSTITIAL_VIDEO_IMPRESSION_DELAY = Number(LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_IMPRESSION_DELAY));
        this.config.INTERSTITIAL_VIDEO_IMPRESSION_INTERVAL = Number(LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_IMPRESSION_INTERVAL));
        this.config.INTERSTITIAL_VIDEO_LIMIT_IMPRESSION_PER_INTERVAL = Number(LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_LIMIT_IMPRESSION_PER_INTERVAL));
        this.config.INTERSTITIAL_VIDEO_RESTART_LIMIT_IMPRESSIONS = LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_RESTART_LIMIT_IMPRESSIONS) === true;
        this.config.INTERSTITIAL_VIDEO_CLOSABLE_WITHOUT_VIEW = LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_CLOSABLE_WITHOUT_VIEW) === true;
        this.config.INTERSTITIAL_VIDEO_SSP_ID = Number(LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_SSP_ID));
        this.config.INTERSTITIAL_VIDEO_AD_DURATION = Number(LS.get(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_AD_DURATION));
    }

    updateConfigParams(telegramConfig: any): void {
        let customConfig = telegramConfig.widget[this.getType()];
        if (customConfig) {
            if (customConfig.ssp_id) {
                this.config.INTERSTITIAL_VIDEO_SSP_ID = customConfig.ssp_id ?? this.config.INTERSTITIAL_VIDEO_SSP_ID;
            }

            if (this.getConfigTypeName() in customConfig) {
                let item = customConfig[this.getConfigTypeName()];
                this.config.INTERSTITIAL_VIDEO_IMPRESSION_DELAY = Number(item.impression_delay);
                this.config.INTERSTITIAL_VIDEO_IMPRESSION_INTERVAL = Number(item.impression_interval);
                this.config.INTERSTITIAL_VIDEO_LIMIT_IMPRESSION_PER_INTERVAL = Number(item.limit_impression_per_interval);
                this.config.INTERSTITIAL_VIDEO_RESTART_LIMIT_IMPRESSIONS = item.restart_limit_impressions ?? this.config.INTERSTITIAL_VIDEO_RESTART_LIMIT_IMPRESSIONS;
                this.config.INTERSTITIAL_VIDEO_CLOSABLE_WITHOUT_VIEW = item.closable_without_view_available ?? this.config.INTERSTITIAL_VIDEO_CLOSABLE_WITHOUT_VIEW;
                this.config.INTERSTITIAL_VIDEO_AD_DURATION = Number(item.ad_duration) ?? this.config.INTERSTITIAL_VIDEO_AD_DURATION;
            }
        }

        this.setLocalStorageConfig();
    }

    setLocalStorageConfig(): void {
        LS.set(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_IMPRESSION_INTERVAL, this.config.INTERSTITIAL_VIDEO_IMPRESSION_INTERVAL);
        LS.set(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_IMPRESSION_DELAY, this.config.INTERSTITIAL_VIDEO_IMPRESSION_DELAY);
        LS.set(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_LIMIT_IMPRESSION_PER_INTERVAL, this.config.INTERSTITIAL_VIDEO_LIMIT_IMPRESSION_PER_INTERVAL);
        LS.set(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_RESTART_LIMIT_IMPRESSIONS, this.config.INTERSTITIAL_VIDEO_RESTART_LIMIT_IMPRESSIONS);
        LS.set(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_SSP_ID, this.config.INTERSTITIAL_VIDEO_SSP_ID);
        LS.set(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_CLOSABLE_WITHOUT_VIEW, this.config.INTERSTITIAL_VIDEO_CLOSABLE_WITHOUT_VIEW);
        LS.set(LOCAL_STORAGE_KEYS.INTERSTITIAL_VIDEO_AD_DURATION, this.config.INTERSTITIAL_VIDEO_AD_DURATION);
    }
}