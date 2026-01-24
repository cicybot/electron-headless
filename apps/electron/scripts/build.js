// build.js
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

esbuild.build({
    entryPoints: ['main.js'],
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
const dir = path.resolve(__dirname,"../");

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
    buildBrowser(dir+'/browser/content-inject.js', dir+'/dist/content.js')
    build(dir+'/browser/extension/content.js', dir+'/dist/chrome-extension/content.js')
    build(dir+'/browser/extension/background.js', dir+'/dist/chrome-extension/background.js')

    fs.copyFileSync(dir+"/browser/extension/index.html",dir+"/dist/chrome-extension/index.html")
    fs.copyFileSync(dir+"/browser/extension/manifest.json",dir+"/dist/chrome-extension/manifest.json")
}
main()