export interface TelegramUser {
    id: number;
    language_code: string;
    is_premium?: boolean;
    last_name?: string;
    first_name: string;
}

export interface TelegramWebApp {
    version?: string;
    platform?: string;
    expand?: () => void;
    openLink?: (url: string) => void;
    initDataUnsafe?: {
        user?: TelegramUser;
    };
}

export interface TelegramNamespace {
    WebApp?: TelegramWebApp;
}

declare global {
    interface Window {
        Telegram?: TelegramNamespace;
    }
}