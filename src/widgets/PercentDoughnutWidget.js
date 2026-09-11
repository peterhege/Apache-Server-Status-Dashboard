import DoughnutWidget from './DoughnutWidget.js';

export default class PercentDoughnutWidget extends DoughnutWidget {

    constructor(options = {}) {
        if (typeof options.info === 'undefined') {
            options.info = value => `<div class="fs-5 fw-bold">${value[0]}%</div><div class="text-muted small">${options.label ?? 'Value'}</div>`;
        }
        super(options);
        this.max = options.max ?? 100;
    }

    update(data) {
        const value = this.getValue(data);
        let max = this.getMax(data);
        if (max < value) this.max = max = value;

        this.chart.data.labels = this.labels;
        this.chart.data.datasets[0].data = [value, max - value];
        this.chart.data.datasets[0].backgroundColor = [
            this.getValueColor(value, max),
            this.getBootstrapColor('secondary')
        ];

        this.updateInfo([value, max]);

        this.chart.update();
    }

    getValueColor(value, max) {
        const percent = value / max;
        if (percent >= .75) return this.getBootstrapColor('danger');
        if (percent >= .50) return this.getBootstrapColor('warning');
        return this.getBootstrapColor('success');
    }

    getBootstrapColor(name) {
        return getComputedStyle(document.documentElement)
            .getPropertyValue(`--bs-${name}`)
            .trim();
    }

    getMax(data) {
        if (typeof this.max === 'function') return this.max(data);
        return this.max;
    }
}
