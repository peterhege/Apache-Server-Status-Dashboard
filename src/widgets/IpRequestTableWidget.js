import DataTableWidget from './DataTableWidget.js';
import IpService from '../ip/IpService.js';

export default class IpRequestTableWidget extends DataTableWidget {

    constructor(options = {}) {
        super(options);

        this.ipCounts = new Map();
        this.ipRequests = new Map();
        this.ipData = {};
    }


    getDefaultWidth() {
        return 12;
    }


    async getValue(data) {
        const valueHeaders = ['', 'Country', 'Organization', 'IP', 'Count', 'Abused'];
        const processTable = data.processTable;

        if (!processTable) {
            return {
                headers: valueHeaders,
                rows: []
            };
        }

        const headers = processTable.headers;

        const srvIndex = headers.findIndex(
            header => header.toLowerCase() === 'srv'
        );

        const pidIndex = headers.findIndex(
            header => header.toLowerCase() === 'pid'
        );

        const clientIndex = headers.findIndex(
            header => header.toLowerCase() === 'client'
        );

        const requestIndex = headers.findIndex(
            header => header.toLowerCase() === 'request'
        );

        if (
            srvIndex === -1 ||
            pidIndex === -1 ||
            clientIndex === -1 ||
            requestIndex === -1
        ) {
            return {
                headers: valueHeaders,
                rows: []
            };
        }


        /*
         * Collect unique requests
         */

        for (const row of processTable.rows) {

            const ip = row[clientIndex];

            if (!ip) {
                continue;
            }

            const requestKey = [
                row[srvIndex],
                row[pidIndex],
                row[clientIndex],
                row[requestIndex]
            ].join('|');


            if (!this.ipRequests.has(ip)) {
                this.ipRequests.set(ip, new Set());
            }

            const requests =
                this.ipRequests.get(ip);


            // Ezt a konkrét requestet már láttuk
            if (requests.has(requestKey)) {
                continue;
            }


            // Új request ennél az IP-nél
            requests.add(requestKey);

            this.ipCounts.set(
                ip,
                (this.ipCounts.get(ip) ?? 0) + 1
            );
        }

        /*
         * IP information
         */

        const ips = [
            ...this.ipCounts.keys()
        ];

        if (ips.length) {
            this.ipData = await IpService.many(ips, true);
        }


        /*
         * Build rows
         */

        return {
            headers: valueHeaders,

            rows: [...this.ipCounts.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([ip, count]) => {

                    const info =
                        this.ipData[ip] ?? null;

                    return [
                        this.getStatusHtml(info),
                        this.getCountryHtml(info),
                        info?.organizationName ?? '',
                        `<a href="https://ipinfo.io/${encodeURIComponent(ip)}" target="_blank">${ip}</a>`,
                        count,
                        this.getAbuseHtml(ip, info)
                    ];
                })
        };
    }


    getStatusHtml(info) {

        if (info?.isAbuse === true) {
            return `
                <i class="bi bi-circle-fill text-danger"></i>
            `;
        }

        /*
         * TODO:
         *
         * if (info?.isBot === true) {
         *     return `
         *         <i class="bi bi-circle-fill text-warning"></i>
         *     `;
         * }
         */

        return `
            <i class="bi bi-circle-fill text-success"></i>
        `;
    }


    getCountryHtml(info) {

        if (!info?.countryCode) {
            return '';
        }

        const flag = info.flagUrl
            ? `
                <img
                    src="${info.flagUrl}"
                    alt="${info.countryCode ?? ''}"
                    style="height: 1em;">
              `
            : '';

        return `${flag} ${info.country}`;
    }


    getAbuseHtml(ip, info) {

        let icon = '<i class="bi bi-question-lg text-secondary"></i>';

        if (info?.isAbuse === true) {
            icon = `<i class="bi bi-ban text-danger"></i>`;
        } else if (info?.isAbuse === false) {
            icon = `<i class="bi bi-check-square-fill text-success"></i>`;
        }

        return `
            <div class="d-flex align-items-center gap-2 justify-content-end">

                ${icon}

                <a
                    href="https://www.abuseipdb.com/check/${encodeURIComponent(ip)}"
                    target="_blank"
                    class="btn btn-primary btn-sm">
                    Check
                </a>

            </div>
        `;
    }

    destroy() {

        this.ipCounts.clear();
        this.ipRequests.clear();
        this.ipData = {};

        super.destroy();
    }
}
