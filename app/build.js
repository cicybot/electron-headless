// build.js
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

esbuild.build({
    entryPoints: ['src/main.js'],
    bundle: true,
    platform: 'node',
    outfile: 'dist/main.js',
    external: ['electron'],
    minify: false,
    sourcemap: true
}).then(() => {
    console.log('Build finished');

}).catch(() => process.exit(1));

function build(src,dst){
    return esbuild.build({
        entryPoints: [src],
        bundle: true,
        platform: 'node',
        outfile: dst,
        external: [],
        minify: false,
        sourcemap: true
    }).then(() => {
        console.log(`Build ${src} => ${dst} finished`);

    }).catch(() => process.exit(1));

}

function buildBrowser(src,dst){
    return esbuild.build({
        entryPoints: [src],
        bundle: true,
        platform: 'browser',
        format: 'iife',
        outfile: dst,
        external: [],
        minify: false,
        sourcemap: false
    }).then(() => {
        console.log(`Build browser ${src} => ${dst} finished`);

    }).catch(() => process.exit(1));

}
async function main(){
    buildBrowser('src/content-inject.js', 'dist/content.js')
    build('src/extension/content.js', '../chrome-extension/content.js')
    build('src/extension/background.js', '../chrome-extension/background.js')
}
main()