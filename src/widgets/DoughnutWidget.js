import Widget from '../Widget.js';

export default class DoughnutWidget extends Widget {

    constructor(options = {}) {
        super(options);

        this.labels = options.labels ?? [options.label ?? 'Value', 'Idle'];
        this.info = options.info ?? null;

        this.chart = null;
    }


    getDefaultWidth() {
        return 3;
    }


    render(container) {
        this.container = container;

        this.generateCard();
        this.body = this.card.querySelector('.card-body');
        this.body.innerHTML = '<div class="apache-doughnut-chart"><canvas></canvas></div>';

        container.appendChild(this.card);

        this.chart = new Chart(
            this.card.querySelector('canvas'),
            {
                type: 'doughnut',

                data: {
                    labels: this.labels,

                    datasets: [
                        {
                            data: []
                        }
                    ]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,

                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            }
        );
    }

    update(data) {
        const value = this.getValue(data);
        this.chart.data.labels = this.labels;
        this.chart.data.datasets[0].data = value;
        this.chart.update();
    }

    updateInfo(value) {
        if (!this.info || !this.body) {
            return;
        }

        const content =
            typeof this.info === 'function'
                ? this.info(value)
                : this.info;

        let infoElement = this.body.querySelector(
            '.apache-doughnut-info'
        );

        if (!infoElement) {
            infoElement = document.createElement('div');

            infoElement.className = 'apache-doughnut-info position-absolute text-center';

            this.body.style.position = 'relative';

            this.body.appendChild(infoElement);
        }

        infoElement.innerHTML = content;
    }

    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }

        super.destroy();
    }
}
