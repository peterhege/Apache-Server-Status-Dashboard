import IpInfoService from './IpInfoService.js';
import IpAbuseService from './IpAbuseService.js';
import IpLookupManager from "./IpLookupManager";

export default class IpService {

    static MAX_LOOKUPS = 50;
    static MAX_EXCEPTION = 30;
    static COOLDOWN_TTL = 60 * 60 * 1000; // 1 óra
    static STORAGE_KEY = 'apache-dashboard-ip-service';

    static async many(ips, useLookupManager = false) {
        const uniqueIps = [...new Set(ips.filter(ip => ip))];
        const result = {};

        let infoLookups = 0;
        let abuseLookups = 0;

        for (const ip of uniqueIps) {
            result[ip] = {
                country: null,
                countryCode: null,
                flagUrl: null,
                organizationName: null,
                isAbuse: null
            };

            /*
             * IP information
             */

            let infoAllowed = false;
            try {
                infoAllowed = !useLookupManager && !this.isOnCooldown('info') && infoLookups < this.MAX_LOOKUPS;
                const info = await IpInfoService.get(ip, infoAllowed);
                if (useLookupManager && info?.fromCache !== true) IpLookupManager.register([ip]);
                if (info?.fromCache !== true && infoAllowed) infoLookups++;
                this.applyInfo(result[ip], info);
            } catch (error) {
                if (infoAllowed) infoLookups++;
                this.recordException('info');
                console.error(`IpInfoService failed for ${ip}:`, error);
            }

            /*
             * Abuse information
             */

            let abuseAllowed = false;
            try {
                abuseAllowed = !useLookupManager && !this.isOnCooldown('abuse') && abuseLookups < this.MAX_LOOKUPS;
                const abuse = await IpAbuseService.get(ip, abuseAllowed);
                if (useLookupManager && abuse?.fromCache !== true) IpLookupManager.register([ip]);
                if (abuse?.fromCache !== true && abuseAllowed) abuseLookups++;
                if (abuse !== null) result[ip].isAbuse = abuse.listed;
            } catch (error) {
                if (abuseAllowed) abuseLookups++;
                this.recordException('abuse');
                console.error(`IpAbuseService failed for ${ip}:`, error);
            }
        }

        return result;
    }


    static applyInfo(target, info) {
        if (!info) return;

        target.country = info.country ?? null;
        target.countryCode = info.country_code ?? null;
        target.flagUrl = info.flag?.img ?? null;
        target.organizationName = info.connection?.org ?? null;
    }


    static getState() {
        const stored = localStorage.getItem(this.STORAGE_KEY);

        if (!stored) {
            return {
                info: {
                    exceptions: 0,
                    cooldownUntil: 0
                },
                abuse: {
                    exceptions: 0,
                    cooldownUntil: 0
                }
            };
        }

        try {
            return JSON.parse(stored);
        } catch (error) {
            console.error('Failed to load IP service state:', error);

            return {
                info: {
                    exceptions: 0,
                    cooldownUntil: 0
                },
                abuse: {
                    exceptions: 0,
                    cooldownUntil: 0
                }
            };
        }
    }


    static saveState(state) {
        localStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify(state)
        );
    }

    static isOnCooldown(service) {
        const state = this.getState();
        const serviceState = state[service];

        if (!serviceState) return false;

        if (serviceState.cooldownUntil <= Date.now()) {
            if (serviceState.cooldownUntil) {
                serviceState.cooldownUntil = 0;
                serviceState.exceptions = 0;
                this.saveState(state);
            }
            return false;
        }

        return true;
    }


    static recordException(service) {
        const state = this.getState();
        const serviceState = state[service];

        serviceState.exceptions++;

        if (serviceState.exceptions >= this.MAX_EXCEPTION) {
            serviceState.cooldownUntil = Date.now() + this.COOLDOWN_TTL;
            serviceState.exceptions = 0;
            console.warn(`${service} IP service entered cooldown`);
        }

        this.saveState(state);
    }
}
