import {init, initData} from "@telegram-apps/sdk";
import {TelegramData} from "../interfaces";


export class TelegramService {
    private telegramData: TelegramData = {};

    private initTelegramData(debug: boolean): void {
        if (typeof window === 'undefined') {
            throw new Error("RichPartnersTelegramAds can only be called in a browser environment.");
        }

        if (debug) {
            this.telegramData = {
                telegram_id: '123456789',
                language_code: 'en',
                premium: false,
                last_name: 'publisher',
                firstName: 'publisher',
                version: '8.0',
                platform: 'weba',
            }

            return;
        }

        const sdk = init();
        const user = initData?.user || {};
        const tg = window.Telegram?.WebApp || {};
        const initParams = sessionStorage.getItem('__telegram__initParams');
        const launchParams = sessionStorage.getItem('tapps/launchParams') ?? sessionStorage.getItem("telegram-apps/launch-params") ?? sessionStorage.getItem("tma.js/launch-params");
        const data = initParams && JSON.parse(initParams);
        const dataLaunchParams = launchParams && JSON.parse(launchParams);

        if (data && Object.keys(data).length) {
            const data = JSON.parse(initParams);

            const urlParams = new URLSearchParams(data.tgWebAppData);
            const userParam = urlParams.get('user');
            const userData = userParam ? JSON.parse(decodeURIComponent(userParam)) : {};

            if (userData.id === undefined) {
                throw new Error('initParams not installed.');
            }

            this.telegramData = {
                telegram_id: String(userData.id || ''),
                language_code: userData.language_code || '',
                premium: userData.is_premium || false,
                last_name: userData.last_name || '',
                firstName: userData.first_name || '',
                version: data.tgWebAppVersion || '',
                platform: data.tgWebAppPlatform || '',
            }
        } else if (dataLaunchParams && Object.keys(dataLaunchParams).length) {
            const decoded = decodeURIComponent(dataLaunchParams);
            const innerParams = new URLSearchParams(decoded);
            const userStr = innerParams.get('user');
            const tgWebAppData = innerParams.get('tgWebAppData');
            const tgWebAppVersion = innerParams.get('tgWebAppVersion');
            const tgWebAppPlatform = innerParams.get('tgWebAppPlatform');

            if (userStr) {
                let user = JSON.parse(decodeURIComponent(userStr));
                this.telegramData = {
                    telegram_id: String(user.id || ''),
                    language_code: user.language_code || '',
                    premium: user.is_premium || false,
                    last_name: user.last_name || '',
                    firstName: user.first_name || '',
                    version: tgWebAppVersion || '',
                    platform: tgWebAppPlatform || '',
                }
            }

            if (tgWebAppData) {
                const urlParams = new URLSearchParams(tgWebAppData);
                const userString = urlParams.get('user');

                if (userString) {
                    const user = JSON.parse(userString);
                    this.telegramData = {
                        telegram_id: String(user.id || ''),
                        language_code: user.language_code || '',
                        premium: user.is_premium || false,
                        last_name: user.last_name || '',
                        firstName: user.first_name || '',
                        version: tgWebAppVersion || '',
                        platform: tgWebAppPlatform || '',
                    }
                }
            }
        } else {
            if (window.Telegram === undefined) {
                throw new Error('The script telegram-web-app.js not connected.');
            }

            const tg = window.Telegram?.WebApp;
            if (!tg?.initDataUnsafe?.user) {
                throw new Error('telegram user not found.');
            }

            this.telegramData = {
                telegram_id: String(tg.initDataUnsafe.user.id),
                language_code: tg.initDataUnsafe.user.language_code,
                premium: tg.initDataUnsafe.user.is_premium || false,
                last_name: tg.initDataUnsafe.user.last_name || '',
                firstName: tg.initDataUnsafe.user.first_name,
                version: tg.version,
            };
        }
    }

    public getTelegramData(debug: boolean): TelegramData {
        this.initTelegramData(debug);

        return this.telegramData;
    }
}
