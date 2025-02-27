export class LocalStorageHelper {
    static set(key: string, value: any, ttl: number | null = null): void {
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

    static get<T>(key: string): T | null | undefined {
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

    static remove(key: string): void {
        localStorage.removeItem(key);
    }

    static clear(): void {
        localStorage.clear();
    }
}