export default class Widget {

    constructor(options = {}) {
        this.id = options.id;
        this.title = options.title;
        this.width = options.width ?? 12;

        this.value = options.value ?? null;

        this.container = null;
        this.card = null;
        this.body = null;
    }


    getDefaultWidth() {
        return 12;
    }


    async getValue(data) {
        if (typeof this.value === 'function') return this.value(data);
        return this.value;
    }


    render(container) {
        throw new Error(
            `${this.constructor.name}.render() must be implemented`
        );
    }


    update(data) {
        throw new Error(
            `${this.constructor.name}.update() must be implemented`
        );
    }


    destroy() {
        this.container = null;
        this.card = null;
        this.body = null;
    }

    generateCard(title = null) {
        this.card = document.createElement('div');
        this.card.className = 'card shadow-sm rounded-4 h-100 border-0';

        this.card.innerHTML = `
            <div class="card-sort card-header bg-transparent border-0 text-muted p-3 pb-0 d-flex align-items-center justify-content-between">
                ${this.title ?? title}
                <i class="bi bi-list fs-5"></i>
            </div>
            <div class="card-body d-flex align-items-center justify-content-center p-3"></div>`;
    }
}
