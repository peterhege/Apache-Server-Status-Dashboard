import Widget from '../Widget.js';

export default class LineChartWidget extends Widget {

    constructor(options = {}) {
        super(options);

        this.series = options.series ?? [];
        this.max = options.max ?? null;

        this.startTime = null;
        this.dataPoints = [];
    }


    getDefaultWidth() {
        return 9;
    }


    render(container) {
        this.container = container;

        this.generateCard();
        this.body = this.card.querySelector('.card-body');
        this.body.innerHTML = '<div class="apache-line-chart w-100"><canvas></canvas></div>';

        container.appendChild(this.card);

        this.chart = new Chart(
            this.card.querySelector('canvas'),
            {
                type: 'line',

                data: {
                    labels: [],
                    datasets: this.series.map(series => ({
                        label: series.label,
                        data: [],
                        tension: 0.3
                    }))
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,

                    scales: {
                        x: {
                            title: {
                                display: false
                            }
                        },

                        y: {
                            beginAtZero: true,
                            max: this.max
                        }
                    },

                    plugins: {
                        legend: {
                            display: this.series.length > 1
                        }
                    }
                }
            }
        );
    }


    update(data) {

        const now =
            Date.now();

        if (this.startTime === null) {
            this.startTime = now;
        }

        const elapsed =
            Math.round(
                (now - this.startTime) / 1000
            );

        this.dataPoints.push({
            time: elapsed,
            values: this.series.map(series =>
                typeof series.value === 'function'
                    ? series.value(data)
                    : series.value
            )
        });

        this.chart.data.labels =
            this.dataPoints.map(
                point => `${point.time}s`
            );

        this.series.forEach(
            (series, index) => {

                this.chart.data.datasets[index].data =
                    this.dataPoints.map(
                        point => point.values[index]
                    );
            }
        );

        this.chart.update();
    }


    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }

        super.destroy();
    }
}
