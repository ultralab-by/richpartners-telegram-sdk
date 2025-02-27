export class ResourceLoader {
    // static async loadJs(src: string): Promise<void> {
    //     if (document.querySelector(`script[src="${src}"]`)) return;
    //
    //     return new Promise((resolve, reject) => {
    //         const script = document.createElement('script');
    //         Object.assign(script, {
    //             type: 'text/javascript',
    //             src,
    //             async: true,
    //             onload: () => resolve(),
    //             onerror: () => reject(new Error(`Failed to load script: ${src}`))
    //         });
    //
    //         document.head.appendChild(script);
    //     });
    // }

    static loadCss(url: string): void {
        if (document.querySelector(`link[href="${url}"]`)) return;

        const link = document.createElement('link');
        Object.assign(link, {
            rel: 'stylesheet',
            type: 'text/css',
            href: url,
            media: 'all'
        });

        document.head.appendChild(link);
    }
}