import { RichPartnersTelegramAds } from "./services/RichPartnersTelegramAds.js";
import { init, initData } from '@telegram-apps/sdk';

const ads = new RichPartnersTelegramAds();

ads.initialize({
    pubId: "123",
    appId: "321",
    debug: false
}).then(() => {
    console.log("SDK успешно инициализирован");
}).catch(error => {
    console.error("Ошибка инициализации SDK:", error);
});