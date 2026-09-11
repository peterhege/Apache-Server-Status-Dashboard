export default class DashboardDependencies {
    static STYLES = [
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css',
        'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
        'https://code.jquery.com/ui/1.14.2/themes/base/jquery-ui.css',
        'https://cdn.datatables.net/3.0.3/css/dataTables.bootstrap5.min.css'
    ];

    static loadStylesheet(url) {
        const link = document.createElement('link');

        link.rel = 'stylesheet';
        link.href = url;

        document.head.appendChild(link);
    }

    static loadStyles() {
        for (const url of DashboardDependencies.STYLES) {
            this.loadStylesheet(url);
        }
    }
}
