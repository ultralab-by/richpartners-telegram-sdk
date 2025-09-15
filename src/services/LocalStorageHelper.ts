import {LOCAL_STORAGE_KEYS} from "../config/index.js";

export class LocalStorageService {
    public set(key: string, value: any, ttl: number | null = null): void {
        if (ttl !== null) {
            const now = Date.now();
            const item = {
                value: value,
                ttl: now + ttl * 1000,
            };
            localStorage.setItem(key, JSON.stringify(item));
        } else {
            localStorage.setItem(key, JSON.stringify(value));
        }
    }

    public get<T>(key: string) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;
        if (itemStr === 'undefined') return undefined;

        try {
            const item = JSON.parse(itemStr);
            if (item.ttl && Date.now() > item.ttl) {
                localStorage.removeItem(key);
                return null;
            }
            return item.value || item;
        } catch {
            return itemStr as unknown as T;
        }
    }

    public remove(key: string): void {
        localStorage.removeItem(key);
    }

    public clear(): void {
        localStorage.clear();
    }

    public getWithPrefix(key: string)
    {
        return LS.get(key);
    }
}

export const LS = new LocalStorageService();
