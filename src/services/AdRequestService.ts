import { UserInfo, RequestData} from "../interfaces/index.js";
import { ResourceLoader } from "../services/index.js";

export class AdRequestService {
    private TELEGRAM_BID_BASE_ENDPOINT = "https://{{ssp_id}}.xml.4armn.com/telegram-bid";

    constructor(
        private debug = false
    ) {}

    public async fetchAds(
        request: RequestData,
        sspId: number,
        callback: (ads: any[]) => void,
    ): Promise<void> {

        if (this.debug) {
            callback(this.generateDebugAdData());
            return;
        }
        try {
            const endpoint = this.TELEGRAM_BID_BASE_ENDPOINT.replace("{{ssp_id}}", String(sspId));
            const response = await fetch(endpoint, {
                method: "POST",
                body: JSON.stringify(request),
            });

            const data = await response.json();
            callback(Array.isArray(data) ? data : []);
        } catch (error) {
            throw new Error('[fetchAds] Error fetching ads:');
        }
    }

    private generateDebugAdData(count = 1): any[] {
        const ads = [];
        for (let i = 0; i < count; i++) {
            ads.push({
                title: `Weather Forecaster ${i + 1}`,
                description: `Accurate 12 Day Weather Forecasts for thousands of places around the World ${i + 1}`,
                image: 'https://richads.com/assets/img/logos/crown-desk.svg',
                banner: 'https://richads.com/assets/img/logos/crown-desk.svg',
                link: 'https://publishers.richads.com/',
                index: i,
                message: 'Weather forecasts from the most accurate weather forecasting technology featuring up to the minute weather reports',
                icon: 'https://cdn.adx1.com/files/67ebb8a633b84_2025_04_01_09_57_58_image.jpeg',
                brand: 'Weatherly',
                button: 'Subscribe',
                video: "https://cdn.adx1.com/files/67e6baca2b60e_2025_03_28_03_05_46_video.mp4",
            });
        }

        return ads;
    }
}
