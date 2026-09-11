import Widget from '../Widget.js';
import ChartColors from '../ChartColors.js';

export default class PieChartWidget extends Widget {

    getDefaultWidth() {
        return 4;
    }

    render(container) {
        this.container = container;

        this.generateCard();
        this.body = this.card.querySelector('.card-body');
        this.body.innerHTML = '<div class="apache-pie-chart"><canvas></canvas></div>';

        container.appendChild(this.card);

        this.chart = new Chart(
            this.card.querySelector('canvas'),
            {
                type: 'pie',

                data: {
                    labels: [],
                    datasets: [
                        {
                            data: [],
                        }
                    ]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {boxWidth: 12}
                        }
                    }
                }
            }
        );
    }


    update(data) {
        const value = this.getValue(data);
        this.chart.data.labels = value.labels;
        this.chart.data.datasets[0].data = value.values;
        this.chart.data.datasets[0].backgroundColor = ChartColors.getColors(value.values.length);

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
