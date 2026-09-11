const fs = require('fs');
const path = require('path');
const less = require('less');
const esbuild = require('esbuild');

const packageJson = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, 'package.json'),
        'utf8'
    )
);

const ROOT = __dirname;

const SRC_DIR = path.join(ROOT, 'src');
const ENTRY_FILE = path.join(SRC_DIR, 'Dashboard.js');

const TEMPLATE_FILE = path.join(
    ROOT,
    'template',
    'dashboard.html'
);

const LESS_FILE = path.join(
    ROOT,
    'less',
    'dashboard.less'
);

const OUTPUT_DIR = path.join(
    ROOT,
    'dist'
);

const OUTPUT_FILE = path.join(
    OUTPUT_DIR,
    'apache-dashboard.user.js'
);


/* ============================================================
   HELPERS
   ============================================================ */

function readFile(file) {
    return fs.readFileSync(file, 'utf8');
}

function writeFile(file, content) {
    fs.writeFileSync(file, content, 'utf8');
}


/* ============================================================
   BUILD
   ============================================================ */

async function build() {

    console.log('Building Apache Server Status Dashboard...');


    /*
     * Template
     */

    const html =
        readFile(TEMPLATE_FILE);


    /*
     * LESS → CSS
     */

    console.log('  LESS: dashboard.less');

    const lessSource =
        readFile(LESS_FILE);

    const lessResult =
        await less.render(lessSource, {
            filename: LESS_FILE
        });

    const css =
        lessResult.css;


    /*
     * JavaScript
     *
     * Dashboard.js az entry point.
     * Az esbuild az importok alapján automatikusan
     * felderíti és bundle-öli a függőségeket.
     */

    console.log('  JS: Dashboard.js');

    const jsResult =
        await esbuild.build({
            entryPoints: [
                ENTRY_FILE
            ],
            bundle: true,
            write: false,
            format: 'iife',
            target: 'es2020'
        });

    const javascript =
        jsResult.outputFiles[0].text;


    /*
     * Userscript
     */

    const output = `
// ==UserScript==
// @name         Apache Server Status Dashboard
// @version      ${packageJson.version}
// @description  ${packageJson.description}
// @match        */server-status
// @grant        GM_addStyle
//
// @require      https://code.jquery.com/jquery-4.0.0.min.js
// @require      https://code.jquery.com/ui/1.14.2/jquery-ui.min.js
// @require      https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js
// @require      https://cdn.jsdelivr.net/npm/chart.js
// @require      https://cdn.datatables.net/3.0.3/js/dataTables.min.js
// @require      https://cdn.datatables.net/3.0.3/js/dataTables.bootstrap5.min.js
//
// ==/UserScript==

/* ============================================================
   GENERATED CSS
   ============================================================ */

GM_addStyle(\`${css}\`);

/* ============================================================
   DASHBOARD HTML
   ============================================================ */

const DASHBOARD_HTML = \`${html}\`;

/* ============================================================
   APPLICATION
   ============================================================ */

const DASHBOARD_VERSION = '${packageJson.version}';

${javascript}
`;


    /*
     * Output directory
     */

    fs.mkdirSync(
        OUTPUT_DIR,
        {recursive: true}
    );


    /*
     * Write output
     */

    writeFile(
        OUTPUT_FILE,
        output
    );


    console.log('');
    console.log(`Build complete: ${OUTPUT_FILE}`);
}


/* ============================================================
   START
   ============================================================ */

build().catch(error => {

    console.error('');
    console.error('BUILD FAILED');
    console.error('');

    console.error(error);

    process.exit(1);
});
