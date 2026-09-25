export default class IpAbuseService {

    static CACHE_KEY = 'apache-dashboard-ip-abuse-cache';

    static CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 nap


    static async get(ip, fromApi = true) {
        if (!ip) return null;
        const cached = this.getCached(ip);
        if (cached !== null) return {...cached, fromCache: true};
        if (!fromApi) return null;

        const response = await fetch(
            `https://blackbox.ipinfo.app/api/v1/${encodeURIComponent(ip)}`
        );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const result = await response.text();

        const data = {
            listed: result.trim() === 'Y',
            checkedAt: Date.now()
        };

        this.setCached(ip, data);

        return {...data, fromCache: false};
    }


    static getCached(ip) {

        const cache = this.loadCache();

        const entry = cache[ip];

        if (!entry) {
            return null;
        }

        if (
            Date.now() - entry.checkedAt >
            this.CACHE_TTL
        ) {
            delete cache[ip];

            this.saveCache(cache);

            return null;
        }

        return entry;
    }


    static setCached(ip, data) {
        const cache = this.loadCache();
        cache[ip] = data;
        this.saveCache(cache);
    }


    static loadCache() {

        const stored = localStorage.getItem(
            this.CACHE_KEY
        );

        if (!stored) {
            return {};
        }

        try {
            return JSON.parse(stored);
        } catch (error) {

            console.error(
                'Failed to load IP abuse cache:',
                error
            );

            return {};
        }
    }


    static saveCache(cache) {

        localStorage.setItem(
            this.CACHE_KEY,
            JSON.stringify(cache)
        );
    }


    static clearCache() {

        localStorage.removeItem(
            this.CACHE_KEY
        );
    }
}
