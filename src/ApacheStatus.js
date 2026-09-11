export default class ApacheStatus {

    async fetch() {
        const response = await fetch(
            window.location.href,
            {
                cache: 'no-store'
            }
        );

        if (!response.ok) {
            throw new Error(
                `Apache server-status request failed: ${response.status}`
            );
        }

        const html = await response.text();

        return this.parse(html);
    }


    parse(html) {
        const parser = new DOMParser();
        const document = parser.parseFromString(html, 'text/html');
        const scoreboard = this.parseScoreboard(document);

        return {
            header: this.parseHeader(document),
            server: this.parseServer(document),
            cpu: this.parseCpu(document),
            metrics: this.parseMetrics(document),
            workers: this.parseWorkers(document),
            load: this.parseLoad(document),
            scoreboard: scoreboard,
            serverTable: this.parseServerTable(document),
            processTable: this.parseProcessTable(document),
            definitionsTable: this.parseDefinitionsTable(document),
            scoreboardKey: this.parseScoreboardKey(document)
        };
    }

    parseHeader(document) {
        return $(document).find('h1').text().trim();
    }

    parseServer(document) {
        const text = document.body.innerText;

        const version_match = text.match(/Server Version:\s*(.+)/i);
        const version = version_match ? version_match[1] : null;

        const mpm_match = text.match(/Server MPM:\s*(.+)/i);
        const mpm = mpm_match ? mpm_match[1] : null;

        const built_match = text.match(/Server Built:\s*(.+)/i);
        const built = built_match ? built_match[1] : null;

        const restart_match = text.match(/Restart Time:\s*(.+)/i);
        const restart = restart_match ? restart_match[1] : null;

        const uptime_match = text.match(/Server uptime:\s*(.+)/i);
        const uptime = uptime_match ? uptime_match[1] : null;

        return {version, mpm, built, restart, uptime};
    }

    parseCpu(document) {
        const text = document.body.innerText;
        const match = text.match(/CPU Usage:.*?-\s*([\d.]+)%\s*CPU load/i);
        return match ? parseFloat(match[1]) : null;
    }


    parseMetrics(document) {
        const text = document.body.innerText;

        const requestsMatch = text.match(
            /([\d.]+)\s+requests\/sec/i
        );

        const kbSecondMatch = text.match(
            /([\d.]+)\s+kB\/sec/i
        );

        const kbRequestMatch = text.match(
            /([\d.]+)\s+kB\/request/i
        );

        const durationMatch = text.match(
            /([\d.]+)\s+ms\/request/i
        );

        return {
            requestsPerSecond: requestsMatch
                ? parseFloat(requestsMatch[1])
                : null,

            kbPerSecond: kbSecondMatch
                ? parseFloat(kbSecondMatch[1])
                : null,

            kbPerRequest: kbRequestMatch
                ? parseFloat(kbRequestMatch[1])
                : null,

            msPerRequest: durationMatch
                ? parseFloat(durationMatch[1])
                : null
        };
    }


    parseWorkers(document) {
        const text = document.body.innerText;

        const match = text.match(
            /(\d+)\s+requests currently being processed,\s*(\d+)\s+idle workers/i
        );

        if (!match) {
            return {
                busy: null,
                idle: null,
                total: null
            };
        }

        const busy = parseInt(match[1], 10);
        const idle = parseInt(match[2], 10);

        return {
            busy,
            idle,
            total: busy + idle
        };
    }


    parseLoad(document) {
        const text = document.body.innerText;

        const match = text.match(
            /Server Load:\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/i
        );

        if (!match) {
            return null;
        }

        return {
            oneMinute: parseFloat(match[1]),
            fiveMinutes: parseFloat(match[2]),
            fifteenMinutes: parseFloat(match[3])
        };
    }


    parseScoreboard(document) {
        const text = document.body.innerText;

        const lines = text
            .split('\n')
            .map(line => line.trim())
            .filter(line => /^[_.SRWKDCLGI]+$/.test(line));

        return lines.join('');
    }


    parseServerTable(document) {
        const tables = [...document.querySelectorAll('table')];

        const table = tables.find(table => {
            const text = table.innerText;

            return (
                text.includes('Slot') &&
                text.includes('PID') &&
                text.includes('Stopping') &&
                text.includes('Connections') &&
                text.includes('Threads') &&
                text.includes('Async connections')
            );
        });

        if (!table) {
            return {
                headers: [],
                rows: []
            };
        }

        const headers = [];
        const header_parents = [];
        const rows = [];

        table.querySelectorAll('tr').forEach((tr, row) => {
            const cells = [...tr.querySelectorAll('td')];
            if (cells.length !== 0) {
                rows.push(cells.map(td => td.innerText.trim()));
                return;
            }

            const header_cols = [...tr.querySelectorAll('th')];
            if (header_cols.length === 0) return;

            header_cols.forEach((th, col) => {
                let text = th.innerText.trim();
                if ($(th).attr('rowspan')) {
                    headers.push(text);
                } else {
                    const colspan = parseInt($(th).attr('colspan') ?? 0);
                    if (colspan) {
                        for (let i = 0; i < colspan; i++) header_parents.push(text);
                    } else if (row === 1) {
                        if (header_parents[col]) text += ` (${header_parents[col]})`;
                        headers.push(text);
                    }
                }
            })
        });

        return {
            headers,
            rows
        };
    }


    parseProcessTable(document) {
        const tables = [...document.querySelectorAll('table')];

        const table = tables.find(table => {
            const headers = [...table.querySelectorAll('th')]
                .map(th => th.innerText.trim());

            return (
                headers.includes('Srv') &&
                headers.includes('PID')
            );
        });

        if (!table) {
            return {
                headers: [],
                rows: []
            };
        }

        const headers = [
            ...table.querySelectorAll('th')
        ].map(th => th.innerText.trim());

        const rows = [...table.querySelectorAll('tr')].map(tr => {
            const cols = [...tr.querySelectorAll('td')];
            if (cols.length === 0) return null;
            return cols.map(td => td.innerText.trim());
        }).filter(row => row);

        return {
            headers,
            rows
        };
    }


    parseDefinitionsTable(document) {
        const tables = [...document.querySelectorAll('table')];

        const table = tables.find(table => {
            const firstRow = table.querySelector('tr');

            if (!firstRow) {
                return false;
            }

            const th = firstRow.querySelector('th');
            const td = firstRow.querySelector('td');

            return (th && th.innerText.trim() === 'Srv' && td);
        });

        if (!table) return [];

        const headers = [
            ...table.querySelectorAll('tr:first-child th')
        ].map(th => th.innerText.trim());

        return [...table.querySelectorAll('tr')]
            .map(tr => {
                return {
                    label: tr.querySelector('th').innerText.trim(),
                    definition: tr.querySelector('td').innerText.trim()
                };
            });
    }

    parseScoreboardKey(document) {
        const paragraphs = [...document.querySelectorAll('p')];

        const paragraph = paragraphs.find(p =>
            p.innerText.includes('Scoreboard Key:')
        );

        if (!paragraph) {
            return {};
        }

        const scoreboardKey = {};

        const codes = [
            ...paragraph.querySelectorAll('code')
        ];

        codes.forEach(codeElement => {
            const code = codeElement.innerText.trim();

            const textNode = codeElement.parentElement.nextSibling;

            if (!textNode) {
                return;
            }

            const description = textNode.textContent
                .replace(/^[",\s]+/, '')
                .replace(/[,\s\n\r"]*$/, '')
                .trim();

            scoreboardKey[code] = description;
        });

        return scoreboardKey;
    }
}
