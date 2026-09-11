import PercentDoughnutWidget from './widgets/PercentDoughnutWidget.js';
import LineChartWidget from './widgets/LineChartWidget.js';
import PieChartWidget from "./widgets/PieChartWidget";
import ScoreboardWidget from "./widgets/ScoreboardWidget";
import DataTableWidget from "./widgets/DataTableWidget";

export default class WidgetManager {

    constructor() {
        this.widgets = new Map();
        this.storageKey = 'apache-dashboard-settings';
        this.settings = this.loadSettings();
        this.registerWidgets();
    }


    registerWidgets() {

        this.register(
            new PercentDoughnutWidget({
                id: 'cpu-doughnut',
                title: 'CPU Usage',
                label: 'CPU',
                value: data => data.cpu ?? 0
            })
        );

        this.register(
            new LineChartWidget({
                id: 'cpu-line-chart',
                title: 'CPU Usage Timeline',
                series: [
                    {
                        label: 'CPU',
                        value: data => data.cpu ?? 0
                    }
                ],
                max: 100
            })
        );

        this.register(
            new PercentDoughnutWidget({
                id: 'workers-doughnut',
                title: 'Workers',
                labels: ['Busy', 'Idle'],
                value: data => data.workers.busy ?? 0,
                max: data => data.workers.total ?? 0,
                info: value => `<div class="fs-5 fw-bold">${value[0]}/${value[1]}</div><div class="text-muted small">Busy / Idle</div>`
            })
        );

        this.register(
            new LineChartWidget({
                id: 'workers-line-chart',
                title: 'Workers Timeline',
                series: [
                    {
                        label: 'Busy',
                        value: data => data.workers.busy ?? 0
                    },
                    {
                        label: 'Idle',
                        value: data => data.workers.idle ?? 0
                    }
                ]
            })
        );

        this.register(
            new PieChartWidget({
                id: 'worker-states-pie',
                title: 'Worker States',

                value: data => {
                    const labels =
                        Object.keys(data.scoreboardKey)
                            .filter(key => key !== '.')
                            .map(key => data.scoreboardKey[key]);

                    const values =
                        Object.keys(data.scoreboardKey)
                            .filter(key => key !== '.')
                            .map(key => [...data.scoreboard]
                                .filter(state => state === key)
                                .length
                            );

                    return {
                        labels,
                        values
                    };
                }
            })
        );

        this.register(
            new ScoreboardWidget({
                id: 'scoreboard',
                title: 'Scoreboard'
            })
        );

        this.register(
            new PercentDoughnutWidget({
                id: 'load-one-minute',
                title: 'Server Load (1 min)',
                label: '1 min',
                value: data => data.load.oneMinute,
                max: 4,
                info: value =>
                    `<div class="fs-5 fw-bold">${value[0].toFixed(2)}</div>
             <div class="text-muted small">1 min</div>`
            })
        );

        this.register(
            new PercentDoughnutWidget({
                id: 'load-five-minutes',
                title: 'Server Load (5 min)',
                label: '5 min',
                value: data => data.load.fiveMinutes,
                max: 4,
                info: value =>
                    `<div class="fs-5 fw-bold">${value[0].toFixed(2)}</div>
             <div class="text-muted small">5 min</div>`
            })
        );

        this.register(
            new PercentDoughnutWidget({
                id: 'load-fifteen-minutes',
                title: 'Server Load (15 min)',
                label: '15 min',
                value: data => data.load.fifteenMinutes,
                max: 4,
                info: value =>
                    `<div class="fs-5 fw-bold">${value[0].toFixed(2)}</div>
             <div class="text-muted small">15 min</div>`
            })
        );

        this.register(
            new PercentDoughnutWidget({
                id: 'requests-per-second',
                title: 'Request Rate',
                label: 'req/s',
                value: data => data.metrics.requestsPerSecond,
                max: 100,
                info: value =>
                    `<div class="fs-5 fw-bold">${value[0].toFixed(1)}</div>
             <div class="text-muted small">req/s</div>`
            })
        );

        this.register(
            new PercentDoughnutWidget({
                id: 'kb-per-second',
                title: 'Transfer Rate',
                label: 'kB/s',
                value: data => data.metrics.kbPerSecond,
                max: 1000,
                info: value =>
                    `<div class="fs-5 fw-bold">${value[0].toFixed(1)}</div>
             <div class="text-muted small">kB/s</div>`
            })
        );

        this.register(
            new PercentDoughnutWidget({
                id: 'kb-per-request',
                title: 'Request Size',
                label: 'kB/request',
                value: data => data.metrics.kbPerRequest,
                max: 100,
                info: value =>
                    `<div class="fs-5 fw-bold">${value[0].toFixed(1)}</div>
             <div class="text-muted small">kB/request</div>`
            })
        );

        this.register(
            new PercentDoughnutWidget({
                id: 'ms-per-request',
                title: 'Response Time',
                label: 'ms/request',
                value: data => data.metrics.msPerRequest,
                max: 1000,
                info: value =>
                    `<div class="fs-5 fw-bold">${value[0].toFixed(1)}</div>
             <div class="text-muted small">ms/request</div>`
            })
        );

        this.register(
            new DataTableWidget({
                id: 'server-processes',
                title: 'Server Processes',

                value: data => ({
                    headers: data.processTable.headers,
                    rows: data.processTable.rows
                })
            })
        );

        this.register(
            new DataTableWidget({
                id: 'detailed-processes',
                title: 'Detailed Processes',

                value: data => ({
                    headers: data.serverTable.headers,
                    rows: data.serverTable.rows
                })
            })
        );
    }


    register(widget) {

        if (this.widgets.has(widget.id)) {
            throw new Error(
                `Widget already registered: ${widget.id}`
            );
        }

        this.widgets.set(widget.id, widget);

        this.initializeWidgetSettings(widget);
    }


    initializeWidgetSettings(widget) {
        if (!this.settings.widgets[widget.id]) {
            const defaultWidth = widget.getDefaultWidth();
            const width =
                typeof defaultWidth === 'number'
                    ? defaultWidth
                    : defaultWidth.lg;

            this.settings.widgets[widget.id] = {
                enabled: true,
                width
            };
        }
    }

    loadSettings() {

        const defaultSettings = {
            version: DASHBOARD_VERSION,
            widgets: {}
        };

        const stored = localStorage.getItem(
            this.storageKey
        );

        if (!stored) {
            return defaultSettings;
        }

        try {
            const settings = JSON.parse(stored);

            if (!settings.widgets) {
                settings.widgets = {};
            }

            return settings;

        } catch (error) {

            console.error(
                'Failed to load dashboard settings:',
                error
            );

            return defaultSettings;
        }
    }


    saveSettings() {
        this.settings.version = DASHBOARD_VERSION;

        localStorage.setItem(
            this.storageKey,
            JSON.stringify(this.settings)
        );
    }

    saveWidgetOrder(grid) {
        $(grid).find('[data-widget-id]')
            .each((index, column) => {
                const widgetId = column.dataset.widgetId;
                this.settings.widgets[widgetId].order = index;
            });

        this.saveSettings();
    }


    initialize() {

        const grid = document.querySelector(
            '#apache-widget-grid'
        );

        if (!grid) {
            throw new Error(
                'Widget grid not found'
            );
        }

        this.renderWidgets(grid);

        this.initializeSettingsModal();
    }


    renderWidgets(grid) {

        const widgets = [
            ...this.widgets.values()
        ].filter(widget => {

            const settings =
                this.settings.widgets[widget.id];

            return settings.enabled;
        });

        widgets.sort((a, b) => {

            const orderA =
                this.settings.widgets[a.id].order ?? 999;

            const orderB =
                this.settings.widgets[b.id].order ?? 999;

            return orderA - orderB;
        });

        for (const widget of widgets) {
            this.renderWidget(grid, widget);
        }

        this.initializeResizable(grid);
        this.initializeSortable(grid);
    }


    renderWidget(grid, widget) {

        const settings = this.settings.widgets[widget.id];
        const column = document.createElement('div');

        column.className = this.getColumnClass(
            widget,
            settings.width
        );

        column.dataset.widgetId = widget.id;

        grid.appendChild(column);

        widget.render(column);
    }


    getColumnClass(widget, width = null) {

        if (width !== null) {
            return [
                `col-lg-${width}`,
                `col-xl-${width}`,
                'mb-4'
            ].join(' ');
        }

        const defaultWidth = widget.getDefaultWidth();

        if (typeof defaultWidth === 'number') {
            return `col-${defaultWidth} mb-4`;
        }

        return [
            `col-lg-${defaultWidth.lg}`,
            `col-xl-${defaultWidth.xl}`,
            'mb-4'
        ].join(' ');
    }


    update(data) {
        this.data = data;
        for (const widget of this.widgets.values()) {
            const settings = this.settings.widgets[widget.id];
            if (!settings.enabled) continue;
            widget.update(data);
        }
    }


    initializeSettingsModal() {

        const container = document.querySelector(
            '#apache-widget-settings'
        );

        const applyButton = document.querySelector(
            '#apache-settings-apply'
        );

        if (!container || !applyButton) {
            throw new Error(
                'Widget settings elements not found'
            );
        }

        this.renderSettings(container);

        applyButton.addEventListener(
            'click',
            () => this.applySettings()
        );
    }

    initializeResizable(grid) {
        $(grid)
            .find('[data-widget-id]')
            .each((index, column) => {
                this.initializeResizableColumn(grid, column);
            });
    }

    initializeResizableColumn(grid, column) {
        $(column).resizable({
            handles: 'e',
            minWidth: 1,

            start: () => {
                $(column).addClass(
                    'apache-widget-resizing'
                );
            },

            resize: (event, ui) => {

                const gridWidth =
                    grid.clientWidth;

                const columnWidth =
                    gridWidth / 12;

                let width =
                    Math.round(
                        ui.size.width /
                        columnWidth
                    );

                width = Math.max(
                    1,
                    Math.min(12, width)
                );

                const style = getComputedStyle(column);
                const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);

                const snappedWidth = width * columnWidth - padding;

                console.log({gridWidth, columnWidth, width, snappedWidth});

                ui.size.width = snappedWidth;
            },

            stop: (event, ui) => {

                $(column).removeClass(
                    'apache-widget-resizing'
                );

                const width =
                    this.calculateBootstrapWidth(
                        grid,
                        ui.size.width
                    );

                const widgetId =
                    column.dataset.widgetId;

                // A jQuery UI által beállított
                // inline width eltávolítása.
                $(column).css('width', '');

                // A régi resizable példány eltávolítása.
                $(column).resizable('destroy');

                // Bootstrap class + localStorage.
                this.setWidgetWidth(
                    widgetId,
                    width
                );

                // Újra inicializáljuk a méretezést
                // az új Bootstrap szélességgel.
                this.initializeResizableColumn(
                    grid,
                    column
                );
            }
        });
    }

    initializeSortable(grid) {
        $(grid).sortable({
            items: '[data-widget-id]',
            handle: '.card-sort',
            tolerance: 'pointer',

            update: () => {
                this.saveWidgetOrder(grid);
            }
        });
    }

    calculateBootstrapWidth(grid, pixelWidth) {
        const rowWidth = grid.clientWidth;
        const columnWidth = rowWidth / 12;
        const width = Math.round(pixelWidth / columnWidth);

        return Math.max(1, Math.min(12, width));
    }

    setWidgetWidth(widgetId, width) {

        const column = document.querySelector(
            `[data-widget-id="${widgetId}"]`
        );

        if (!column) {
            return;
        }

        const widget =
            this.widgets.get(widgetId);

        if (!widget) {
            return;
        }

        column.className =
            this.getColumnClass(widget, width);

        this.settings.widgets[widgetId].width =
            width;

        this.saveSettings();
    }


    renderSettings(container) {

        container.innerHTML = '';

        for (const widget of this.widgets.values()) {

            const settings =
                this.settings.widgets[widget.id];

            const wrapper =
                document.createElement('div');

            wrapper.className =
                'form-check form-switch mb-3';

            wrapper.innerHTML = `
                <input
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="widget-setting-${widget.id}"
                    data-widget-id="${widget.id}"
                    ${settings.enabled ? 'checked' : ''}
                >

                <label
                    class="form-check-label"
                    for="widget-setting-${widget.id}">

                    ${widget.title}

                    ${
                settings.isNew
                    ? '<span class="badge text-bg-primary ms-2">New</span>'
                    : ''
            }

                </label>
            `;

            container.appendChild(wrapper);
        }
    }


    applySettings() {

        const inputs = document.querySelectorAll(
            '#apache-widget-settings input[data-widget-id]'
        );

        for (const input of inputs) {

            const widgetId =
                input.dataset.widgetId;

            this.settings.widgets[widgetId].enabled =
                input.checked;
        }

        this.saveSettings();

        this.reloadWidgets();

        $('#apache-settings-modal').modal('hide');
    }


    reloadWidgets() {

        const grid = document.querySelector(
            '#apache-widget-grid'
        );

        if (!grid) {
            return;
        }

        for (const widget of this.widgets.values()) {
            widget.destroy();
        }

        grid.innerHTML = '';

        this.renderWidgets(grid);
        if (this.data) this.update(this.data);
    }


    destroy() {

        for (const widget of this.widgets.values()) {
            widget.destroy();
        }

        this.widgets.clear();
    }
}
