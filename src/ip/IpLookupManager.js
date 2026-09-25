import IpService from './IpService.js';

export default class IpLookupManager {

    static BATCH_SIZE = 50;
    static INTERVAL = 60000;

    static ips = new Set();
    static timer = null;
    static running = false;


    static register(ips) {
        console.log('IpLookupManager.register', ips);
        for (const ip of ips) {
            if (ip) this.ips.add(ip);
        }

        this.start();
    }


    static start() {

        if (this.timer) {
            return;
        }

        this.timer = setInterval(
            () => this.process(),
            this.INTERVAL
        );

        this.process().then();
    }


    static async process() {
        console.log('IpLookupManager.process()');
        if (this.running || !this.ips.size) {
            return;
        }

        this.running = true;

        let ips = [];

        try {

            ips = [
                ...this.ips
            ].slice(0, this.BATCH_SIZE);

            console.log('IpLookupManager.process', ips);

            if (!ips.length) {
                return;
            }

            await IpService.many(ips);

        } catch (error) {

            console.error(
                'IP lookup failed:',
                error
            );

        } finally {

            for (const ip of ips) {
                this.ips.delete(ip);
            }

            this.running = false;
        }
    }


    static stop() {

        if (!this.timer) {
            return;
        }

        clearInterval(this.timer);
        this.timer = null;
    }


    static clear() {
        this.ips.clear();
    }

    static shutdown() {
        this.stop();
        this.clear();
    }
}
