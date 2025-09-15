import {WidgetManager} from "../services/index.js";
import {RequestData} from "./requestData.js";

export interface RichPartnersAds {
    isConfigInstalledInLocalStorage(): boolean;
    loadConfigByLocalStorage(): void;
    updateConfigParams(config: any): void;
    getType(): string;
    getSsp(): number;
    handle(): void;
    handleTrigger(autoRedirect: boolean): Promise<string>;
}