import {LS} from "../services/index.js";
import {LOCAL_STORAGE_KEYS} from "../config/index.js";


export class TonWallet {
    private TON_WALLET_UPDATE_TIME: number = 86400;
    private STW_ENDPOINT: string = "https://us.boxif.xyz/nty/stw";
    private STW_ENDPOINT_2: string = "https://eu.boxif.xyz/nty/stw";

    handle(telegramId: string) {
        if (this.isNeedUploadTelegramAddress()) {
            this.sendTonWallet(telegramId).then(r => {
                LS.set(LOCAL_STORAGE_KEYS.RICHPARTNERS_STW, 1, this.TON_WALLET_UPDATE_TIME);
            });
        }
    }

    isNeedUploadTelegramAddress() {
        return !(LS.get(LOCAL_STORAGE_KEYS.RICHPARTNERS_STW) || this.getWalletAddress() === null);
    }

    async sendTonWallet(telegramId: string) {
        const secretKey = "";
        const nonce = crypto.getRandomValues(new Uint8Array(12));

        try {
            await this.encryptAESGCM(this.getWalletAddress(), secretKey, nonce).then(async encrypted => {
                let endpoint = Math.random() < 0.5 ? this.STW_ENDPOINT : this.STW_ENDPOINT_2;
                await fetch(endpoint, {
                    method: "POST",
                    body: JSON.stringify({
                        "tid": telegramId,
                        "wa": encrypted
                    }),
                });
            });
        } catch (error) {
            throw new Error('Error send tw');
        }
    }

    getKeyBytes(secretKey: string) {
        const encoder = new TextEncoder();
        const keyBytes = encoder.encode(secretKey);
        const fullKey = new Uint8Array(32);
        fullKey.set(keyBytes.slice(0, 32));
        return fullKey;
    }

    bufferToBase64(buffer: Uint8Array) {
        let binary = "";
        buffer.forEach((b: any) => (binary += String.fromCharCode(b)));
        return btoa(binary);
    }

    async encryptAESGCM(data: string, secretKey: string, nonce: Uint8Array) {
        const fullKey = this.getKeyBytes(secretKey);
        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            fullKey,
            {name: "AES-GCM"},
            false,
            ["encrypt"]
        );

        const encoder = new TextEncoder();
        const dataBytes = encoder.encode(data);

        const encryptedBuffer = await crypto.subtle.encrypt(
            {name: "AES-GCM", iv: nonce, tagLength: 128},
            cryptoKey,
            dataBytes
        );
        const ciphertext = new Uint8Array(encryptedBuffer);

        const combined = new Uint8Array(nonce.length + ciphertext.length);
        combined.set(nonce, 0);
        combined.set(ciphertext, nonce.length);

        return this.bufferToBase64(combined);
    }


    getWalletAddress() {
        const walletData = LS.get(LOCAL_STORAGE_KEYS.RICHPARTNERS_TON_WALLET);

        return walletData
        && walletData.connectEvent
        && walletData.connectEvent.payload
        && walletData.connectEvent.payload.items
        && walletData.connectEvent.payload.items.length
            ? walletData.connectEvent.payload.items[0].address
            : null;
    }

}

export const TW = new TonWallet();
