import Widget from '../Widget.js';
import ChartColors from '../ChartColors.js';

export default class ScoreboardWidget extends Widget {

    getDefaultWidth() {
        return 8;
    }

    render(container) {
        this.container = container;

        this.generateCard();

        this.body =
            this.card.querySelector('.card-body');

        this.body.innerHTML = `
            <div class="apache-scoreboard-grid"></div>
        `;

        container.appendChild(this.card);
    }

    update(data) {

        const grid =
            this.body.querySelector(
                '.apache-scoreboard-grid'
            );

        const keys =
            Object.keys(data.scoreboardKey);

        const colors = ChartColors.getColors(keys.length);

        const colorMap =
            Object.fromEntries(
                keys.map(
                    (key, index) => [key, key === '.' ? '#f4f4f4' : colors[index]]
                )
            );

        grid.innerHTML =
            [...data.scoreboard]
                .map(
                    state => `
                        <span
                            title="${data.scoreboardKey[state]}"
                            class="ratio ratio-1x1"
                            style="
                                width: .5rem;
                                background-color: ${colorMap[state]};
                            ">
                        </span>
                    `
                )
                .join('');
    }

    destroy() {
        super.destroy();
    }
}
