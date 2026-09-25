import Widget from '../Widget.js';

export default class DataTableWidget extends Widget {

    constructor(options = {}) {
        super(options);
        this.table = null;
    }


    getDefaultWidth() {
        return 12;
    }


    render(container) {
        this.container = container;

        this.generateCard();

        this.body = this.card.querySelector('.card-body');

        this.body.innerHTML = `
        <div class="w-100">
            <table class="table table-striped table-hover w-100">
                <thead></thead>
                <tbody></tbody>
            </table>
        </div>
    `;

        container.appendChild(this.card);
    }


    async update(data) {
        console.log('DataTableWidget.update', data);
        const value = await this.getValue(data);
        if (!this.table) this.initializeTable(value.headers ?? []);
        this.table.clear().rows.add(value.rows).draw(false);
    }

    initializeTable(headers) {

        const table = this.card.querySelector('table');

        this.table = new DataTable(table, {
            columns: headers.map(header => ({
                title: header
            })),

            data: [],

            pageLength: 10,

            order: [],

            autoWidth: false
        });
    }


    destroy() {

        if (this.table) {
            this.table.destroy();
            this.table = null;
        }

        super.destroy();
    }
}
