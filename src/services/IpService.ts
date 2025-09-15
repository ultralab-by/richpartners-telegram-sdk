import { UserInfo } from "../interfaces/index.js";
import { ResourceLoader } from "../services/index.js";

export class IpService {
    private USERINFO_ENDPOINT = "https://eu.convers.link/users/info?callback=userinfo_rp_pu";
    private USERINFO_ENDPOINT_2 = "https://us.convers.link/users/info?callback=userinfo_rp_pu";

    private publisherInfo: UserInfo = { ip: "" };

    public async setIp(): Promise<void> {
        const src = Math.random() < 0.5 ? this.USERINFO_ENDPOINT : this.USERINFO_ENDPOINT_2;

        return new Promise<void>((resolve, reject) => {
            (window as any).userinfo_rp_pu = (data: UserInfo) => {
                this.publisherInfo.ip = data.ip;
                resolve();
            };

            ResourceLoader.loadJs(src).catch(reject);
        });
    }

    public getIp(): string {
        return this.publisherInfo.ip;
    }
}
