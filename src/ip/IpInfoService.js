export default class IpInfoService {

    static storageKey = 'apache-dashboard-ip-info';

    static cacheTtl =
        1000 *
        60 *
        60 *
        24 *
        182;

    static getCache() {

        const stored = localStorage.getItem(
            this.storageKey
        );

        if (!stored) {
            return {};
        }

        try {
            return JSON.parse(stored);
        } catch (error) {

            console.error(
                'Failed to parse IP info cache:',
                error
            );

            return {};
        }
    }


    static saveCache(cache) {

        localStorage.setItem(
            this.storageKey,
            JSON.stringify(cache)
        );
    }


    static getCached(ip) {

        const cache = this.getCache();
        const entry = cache[ip];

        if (!entry) {
            return null;
        }

        const age =
            Date.now() - entry.timestamp;

        if (age >= this.cacheTtl) {

            delete cache[ip];

            this.saveCache(cache);

            return null;
        }

        return entry.data;
    }


    static async get(ip, fromApi = true) {
        if (!ip) return null;
        const cached = this.getCached(ip);
        if (cached) return {...cached, fromCache: true};
        if (!fromApi) return null;

        const response = await fetch(
            `https://ipwho.is/${encodeURIComponent(ip)}`
        );

        if (!response.ok) {
            throw new Error(
                `IP lookup failed: ${response.status}`
            );
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(
                data.message ?? 'IP lookup failed'
            );
        }

        const cache = this.getCache();

        cache[ip] = {
            timestamp: Date.now(),
            data
        };

        this.saveCache(cache);

        return {...data, fromCache: false};
    }


    static remove(ip) {

        const cache = this.getCache();

        if (!cache[ip]) {
            return;
        }

        delete cache[ip];

        this.saveCache(cache);
    }


    static clear() {

        localStorage.removeItem(
            this.storageKey
        );
    }
}
