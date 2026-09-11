import DashboardDependencies from './DashboardDependencies.js';
import ApacheStatus from './ApacheStatus.js';
import WidgetManager from './WidgetManager.js';

export default class Dashboard {

    constructor() {
        this.apacheStatus = new ApacheStatus();
        this.widgetManager = new WidgetManager();

        this.data = null;
        this.refreshTimer = null;
        this.liveEnabled = true;

        this.initialize();
    }

    initialize() {
        console.log('Apache Dashboard loaded');
        DashboardDependencies.loadStyles();
        document.body.innerHTML = DASHBOARD_HTML;

        this.widgetManager.initialize();

        this.initializeRefresh();
        this.initializeLiveButton();
    }

    initializeRefresh() {
        const select = document.querySelector('#apache-refresh-select');

        if (!select) {
            console.error('Refresh select not found');
            return;
        }

        select.addEventListener('change', () => {
            this.startRefresh();
        });

        this.startRefresh();
    }


    initializeLiveButton() {
        const button = document.querySelector('#apache-live-button');

        if (!button) {
            console.error('Live button not found');
            return;
        }

        button.addEventListener('click', () => {
            if (this.liveEnabled) {
                this.stopRefresh();
            } else {
                this.startRefresh();
            }
        });
    }


    startRefresh() {
        const select = document.querySelector('#apache-refresh-select');

        if (!select) {
            return;
        }

        const interval = parseInt(select.value, 10);

        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }

        this.liveEnabled = true;

        this.updateLiveButton();

        this.refresh();

        this.refreshTimer = setInterval(() => {
            this.refresh();
        }, interval);
    }


    stopRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }

        this.liveEnabled = false;

        this.updateLiveButton();
    }


    updateLiveButton() {
        const button = document.querySelector('#apache-live-button');

        if (!button) {
            return;
        }

        if (this.liveEnabled) {
            button.title = 'Live frissítés szüneteltetése';

            button.innerHTML = `
                <i class="bi bi-pause-fill"></i>
            `;
        } else {
            button.title = 'Live frissítés indítása';

            button.innerHTML = `
                <i class="bi bi-play-fill"></i>
            `;
        }
    }


    async refresh() {
        try {
            this.data = await this.apacheStatus.fetch();
            console.log(this.data);

            this.updateHeader(this.data);
            this.widgetManager.update(this.data);
            this.updateStatus(true);
        } catch (error) {
            console.error('Apache Status fetch failed:', error);

            this.updateStatus(false);
        }
    }

    updateHeader(data) {
        const title = document.querySelector('#apache-server-title');
        const subtitle = document.querySelector('#apache-server-subtitle');
        const uptime = document.querySelector('#server-uptime');

        if (title) title.textContent = data.header;
        if (subtitle) subtitle.textContent = `${data.server.version} · MPM: ${data.server.mpm}`;
        if (uptime) uptime.textContent = data.server.uptime;
        $('#server-built').html(data.server.built);
    }


    updateStatus(success) {
        const dot = document.querySelector('#apache-status-dot');
        const lastUpdate = document.querySelector('#apache-last-update');

        if (!dot || !lastUpdate) {
            return;
        }

        if (success) {
            dot.classList.remove('bg-danger', 'bg-secondary');
            dot.classList.add('bg-success');

            lastUpdate.textContent = new Date()
                .toLocaleTimeString();
        } else {
            dot.classList.remove('bg-success', 'bg-secondary');
            dot.classList.add('bg-danger');

            lastUpdate.textContent = 'Error';
        }
    }
}

new Dashboard();
