import {RequestData, adPushStyleData, CapIncrementOptions} from "../interfaces/index.js";
import {LS} from "../services/index.js";
import {PositionType, WidgetType} from "../types/index.js";
import {LOCAL_STORAGE_KEYS} from "../config/index.js";
import {BaseAds} from "./index.js";

export class PushStyleAds extends BaseAds {
    private waitShowed: boolean = false;
    private PUBLISHER_ID_FOR_DIRECT_LINK = "958045";
    private config = {
        PUSH_STYLE_IMPRESSION_DELAY: 15,
        PUSH_STYLE_IMPRESSION_INTERVAL: 86400,
        PUSH_STYLE_LIMIT_IMPRESSION_PER_INTERVAL: 20,
        PUSH_STYLE_LIMIT_IMPRESSION_PER_VIEW: 3,
        PUSH_STYLE_RESTART_LIMIT_IMPRESSIONS: false,
        PUSH_STYLE_POSITION_TYPE: PositionType.positionBottom,
        PUSH_STYLE_CLOSABLE_WITHOUT_VIEW: true,
        PUSH_STYLE_SSP_ID: 13988,
    };

    public getSsp(): number {
        return this.config.PUSH_STYLE_SSP_ID;
    }

    public getType(): string {
        return WidgetType.PUSH_STYLE;
    }

    public override getDefaultBidFloor(): number {
        return 0.001;
    }

    public handleTrigger(autoRedirect: boolean): Promise<string> {
        return new Promise((resolve, reject) => {
            this.initialize();

            const updatedRequestData: RequestData = {
                ...this.requestData,
                motivated: true,
                widget_id: this.widgetId,
                bid_floor: this.getDefaultBidFloor(),
                number_of_bids: this.config.PUSH_STYLE_LIMIT_IMPRESSION_PER_VIEW,
            };

            this.adRequestService!.fetchAds(updatedRequestData, this.getSsp(), (data: adPushStyleData[]) => {
                data = this.updateFetchAdsData(data, updatedRequestData.publisher_id);

                if (data.length === 0) {
                    reject(new Error('Ads not found'));
                }

                this.displayPushStyleAds(data);

                const pushStyle = document.getElementById(this.getNameIdBlock());

                if (autoRedirect && pushStyle) {
                    const image = pushStyle.querySelector('.notification-icon') as HTMLImageElement | null;
                    const adLink = pushStyle.querySelector('.native-block-tg') as HTMLLinkElement | null;

                    if (image && adLink && adLink.href) {
                        image.onload = () => {
                            const container = document.getElementById(this.getNameIdBlock());
                            container?.remove();

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
                    event.preventDefault();
                    const target = (event.target as HTMLElement).closest('.native-block-tg');
                    if (target) {
                        resolve('success');
                    }
                }, {once: true});

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
            number_of_bids: this.config.PUSH_STYLE_LIMIT_IMPRESSION_PER_VIEW,
        };

        document.addEventListener('click', (e) => {
            if (this.isNeededIgnoreClickByEvent(e)) {
                return;
            }

            if (this.isNeedFetchAds()) {
                this.waitShowed = true;
                this.adRequestService!.fetchAds(updatedRequestData, this.getSsp(), (data: adPushStyleData[]) => {
                    data = this.updateFetchAdsData(data, updatedRequestData.publisher_id);

                    if (data.length > 0) {
                        this.displayPushStyleAds(data);
                        this.incrementPushStyleCap(data.length);
                    }

                    this.waitShowed = false;
                });
            }
        });
    }

    private getNameIdBlock(): string {
        return 'telegram-notification-content';
    }

    private isNeedFetchAds(): boolean {
        return this.widgetManager?.getDebug() === true || !this.isCapped();
    }

    private isCapped() {
        if (this.waitShowed) {
            return true;
        }

        let notificationLimit = Math.floor(LS.get(LOCAL_STORAGE_KEYS.PUSH_STYLE_CAP)) ?? 0;

        return (this.config.PUSH_STYLE_LIMIT_IMPRESSION_PER_INTERVAL <= notificationLimit) || LS.get(LOCAL_STORAGE_KEYS.PUSH_STYLE_EXPIRES_CAP) === 1;
    }

    private incrementPushStyleCap(showedItem: number = 0) {
        const capOptions: CapIncrementOptions = {
            capKey: LOCAL_STORAGE_KEYS.PUSH_STYLE_CAP,
            expiresCapKey: LOCAL_STORAGE_KEYS.PUSH_STYLE_EXPIRES_CAP,
            capIntervalKey: LOCAL_STORAGE_KEYS.PUSH_STYLE_CAP_PER_INTERVAL,
            delay: this.config.PUSH_STYLE_IMPRESSION_DELAY,
            interval: this.config.PUSH_STYLE_LIMIT_IMPRESSION_PER_INTERVAL,
            showedItem: showedItem,
        };

        this.incrementCap(capOptions);
    }

    public isConfigInstalledInLocalStorage(): boolean {
        return (
            LS.get(LOCAL_STORAGE_KEYS.PUSH_STYLE_IMPRESSION_INTERVAL)
            && LS.get(LOCAL_STORAGE_KEYS.PUSH_STYLE_IMPRESSION_DELAY)
            && LS.get(LOCAL_STORAGE_KEYS.PUSH_STYLE_LIMIT_IMPRESSION_PER_INTERVAL)
            && LS.get(LOCAL_STORAGE_KEYS.PUSH_STYLE_LIMIT_IMPRESSION_PER_VIEW)
            && LS.get(LOCAL_STORAGE_KEYS.PUSH_STYLE_POSITION_TYPE)
            && LS.get(LOCAL_STORAGE_KEYS.PUSH_STYLE_SSP_ID)
            && LS.get(LOCAL_STORAGE_KEYS.PUSH_STYLE_RESTART_LIMIT_IMPRESSIONS) !== undefined
            && LS.get(LOCAL_STORAGE_KEYS.PUSH_STYLE_CLOSABLE_WITHOUT_VIEW) !== undefined);
    }

    public loadConfigByLocalStorage(): void {
        this.config.PUSH_STYLE_IMPRESSION_DELAY = Number(LS.get(LOCAL_STORAGE_KEYS.PUSH_STYLE_IMPRESSION_DELAY)) || 0;
        this.config.PUSH_STYLE_IMPRESSION_INTERVAL = Number(LS.get(LOCAL_STORAGE_KEYS.PUSH_STYLE_IMPRESSION_INTERVAL)) || 0;
        this.config.PUSH_STYLE_LIMIT_IMPRESSION_PER_INTERVAL = Number(LS.get(LOCAL_STORAGE_KEYS.PUSH_STYLE_LIMIT_IMPRESSION_PER_INTERVAL)) || 0;
        this.config.PUSH_STYLE_LIMIT_IMPRESSION_PER_VIEW = Number(LS.get(LOCAL_STORAGE_KEYS.PUSH_STYLE_LIMIT_IMPRESSION_PER_VIEW)) || 0;
        this.config.PUSH_STYLE_RESTART_LIMIT_IMPRESSIONS = LS.get(LOCAL_STORAGE_KEYS.PUSH_STYLE_RESTART_LIMIT_IMPRESSIONS) === true;
        this.config.PUSH_STYLE_POSITION_TYPE = LS.get(LOCAL_STORAGE_KEYS.PUSH_STYLE_POSITION_TYPE) || "";
        this.config.PUSH_STYLE_CLOSABLE_WITHOUT_VIEW = LS.get(LOCAL_STORAGE_KEYS.PUSH_STYLE_CLOSABLE_WITHOUT_VIEW) === true;
        this.config.PUSH_STYLE_SSP_ID = Number(LS.get(LOCAL_STORAGE_KEYS.PUSH_STYLE_SSP_ID)) || this.config.PUSH_STYLE_SSP_ID;
    }

    public updateConfigParams(telegramConfig: any): void {
        this.setPushStyleConfigParams(telegramConfig);

        let customConfig = telegramConfig.widget[this.getType()];
        if (customConfig) {
            if (customConfig.ssp_id) {
                this.config.PUSH_STYLE_SSP_ID = customConfig.ssp_id ?? this.config.PUSH_STYLE_SSP_ID;
            }

            if ('config' in customConfig) {
                this.setPushStyleConfigParams(customConfig['config']);
            } else if ('config-push-style' in customConfig) {
                this.setPushStyleConfigParams(customConfig['config-push-style']);
            }
        }
        this.setLocalStorageConfig();
    }

    private setPushStyleConfigParams = (item: any) => {
        this.config.PUSH_STYLE_IMPRESSION_DELAY = Number(item.impression_delay);
        this.config.PUSH_STYLE_IMPRESSION_INTERVAL = Number(item.impression_interval);
        this.config.PUSH_STYLE_LIMIT_IMPRESSION_PER_INTERVAL = Number(item.limit_impression_per_interval);
        this.config.PUSH_STYLE_LIMIT_IMPRESSION_PER_VIEW = Number(item.limit_impression_per_view);
        this.config.PUSH_STYLE_RESTART_LIMIT_IMPRESSIONS = item.restart_limit_impressions;
        this.config.PUSH_STYLE_POSITION_TYPE = item.block_position ?? this.config.PUSH_STYLE_POSITION_TYPE;
        this.config.PUSH_STYLE_CLOSABLE_WITHOUT_VIEW = item.closable_without_view_available ?? this.config.PUSH_STYLE_CLOSABLE_WITHOUT_VIEW;
    }

    private setLocalStorageConfig = () => {
        LS.set(LOCAL_STORAGE_KEYS.PUSH_STYLE_IMPRESSION_INTERVAL, this.config.PUSH_STYLE_IMPRESSION_INTERVAL);
        LS.set(LOCAL_STORAGE_KEYS.PUSH_STYLE_IMPRESSION_DELAY, this.config.PUSH_STYLE_IMPRESSION_DELAY);
        LS.set(LOCAL_STORAGE_KEYS.PUSH_STYLE_LIMIT_IMPRESSION_PER_INTERVAL, this.config.PUSH_STYLE_LIMIT_IMPRESSION_PER_INTERVAL);
        LS.set(LOCAL_STORAGE_KEYS.PUSH_STYLE_LIMIT_IMPRESSION_PER_VIEW, this.config.PUSH_STYLE_LIMIT_IMPRESSION_PER_VIEW);
        LS.set(LOCAL_STORAGE_KEYS.PUSH_STYLE_RESTART_LIMIT_IMPRESSIONS, this.config.PUSH_STYLE_RESTART_LIMIT_IMPRESSIONS);
        LS.set(LOCAL_STORAGE_KEYS.PUSH_STYLE_POSITION_TYPE, this.config.PUSH_STYLE_POSITION_TYPE);
        LS.set(LOCAL_STORAGE_KEYS.PUSH_STYLE_CLOSABLE_WITHOUT_VIEW, this.config.PUSH_STYLE_CLOSABLE_WITHOUT_VIEW);
        LS.set(LOCAL_STORAGE_KEYS.PUSH_STYLE_SSP_ID, this.config.PUSH_STYLE_SSP_ID);
    }

    private updateFetchAdsData(data: any, publisherId: string | undefined) {
        if (data.length === 0 && publisherId === this.PUBLISHER_ID_FOR_DIRECT_LINK) {
            data = [{
                "title": "🎁 100% Bonus Up to $500! 🎁",
                "description": "🎰 Get Extra Cash with Our Generous First Deposit Bonus!",
                "image": "https://static.creatives.admachine.co/files/67daa21b23bf5_2025_03_19_10_53_15_image.jpeg",
                "image_preload": "https://static.creatives.admachine.co/files/67daa21b23bf5_2025_03_19_10_53_15_image.jpeg",
                "notification_url": "",
                "link": "https://11745.xml.4armn.com/direct-link?pubid=792489&siteid=1111",
                "bid_price": 0.001,
                "creative_type": "native"
            }];
        }

        return data;
    }

    private displayPushStyleAds(data: any): void {
        if (data.length > 0) {
            this.getOrCreatePushStyleContainer();
        }
        data.forEach((item: adPushStyleData, index: number) => {
            this.showPushStyleAds(item, index === 0);
        });
    }

    private getOrCreatePushStyleContainer() {
        const existingNotification = document.getElementById(this.getNameIdBlock());
        existingNotification?.remove();

        const notificationBlock = document.createElement('div');
        const closeBlock = document.createElement('div');

        notificationBlock.id = this.getNameIdBlock();
        notificationBlock.className = 'notification-container';
        notificationBlock.classList.add(this.getClassTypePosition(this.config.PUSH_STYLE_POSITION_TYPE));

        if (this.config.PUSH_STYLE_CLOSABLE_WITHOUT_VIEW) {
            closeBlock.id = this.getIdCloseButton();
            closeBlock.className = 'close-btn';
            closeBlock.addEventListener('click', () => notificationBlock.remove());
            notificationBlock.appendChild(closeBlock);
        }

        document.body.appendChild(notificationBlock);

        return notificationBlock;
    }

    private showPushStyleAds({title, description, image, link}: adPushStyleData, isFirst: boolean) {
        const container = document.getElementById(this.getNameIdBlock());

        if (!container) {
            throw new Error(`Container ${this.getNameIdBlock()} not found.`);
        }

        const pushStyle = document.createElement('div');
        let pushStyleId = 'notification-' + Math.random().toString(36).substr(2, 9);

        if (isFirst && this.config.PUSH_STYLE_CLOSABLE_WITHOUT_VIEW) {
            pushStyle.classList.add('first-block');
        }

        pushStyle.innerHTML = `
                <a id="${pushStyleId}" class="rp-notification show native-block-tg" href="${link}" target="_blank">
                    <img src="${image}" alt="icon" class="notification-icon" id="notification-icon">
                        <div class="notification-text">
                            <h4 id="notification-title">${title}</h4>
                            <p id="notification-description">${description}</p>
                        </div>
               </a>
            `;

        pushStyle.addEventListener('click', (event) => {
            pushStyle.remove();
            if (container.querySelectorAll(':scope > :not(.close-btn)').length === 0) {
                container.remove();
            }

            const element = document.querySelector('.rp-notification');

            if (element && this.config.PUSH_STYLE_CLOSABLE_WITHOUT_VIEW && !element.parentElement?.classList.contains('first-block')) {
                element.parentElement?.classList.add('first-block');
            }
        });

        container.appendChild(pushStyle);
    }

    private getClassTypePosition(positionType: string): string {
        if (positionType === PositionType.positionBottom) {
            return 'notification-container-bottom';
        }
        if (positionType === PositionType.positionTop) {
            return 'notification-container-top';
        }
        if (positionType === PositionType.positionMiddle) {
            return 'notification-container-middle';
        }

        return '';
    }
}