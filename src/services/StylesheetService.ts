export function injectRichPartnersStylesheet(): void {
    if (typeof document === 'undefined') return;

    const alreadyLoaded = document.querySelector('link[data-richpartners-style]');
    if (alreadyLoaded) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';

    link.href = 'https://richinfo.co/richpartners/telegram/css/style.css';

    link.setAttribute('data-richpartners-style', 'true');
    document.head.appendChild(link);
}