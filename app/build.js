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
    // Copy content.js to dist
    const srcContent = path.join(__dirname, 'src/content-inject.js');
    const distContent = path.join(__dirname, 'dist/content.js');
    fs.copyFile(srcContent, distContent, (err) => {
        if (err) {
            console.error('Failed to copy content.js:', err);
        } else {
            console.log('content.js copied to dist');
        }
    });

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
        console.log(`Build ${src} => ${det} finished`);

    }).catch(() => process.exit(1));

}
async function main(){
    build('src/content-inject.js', 'dist/content.js')
    build('src/extension/content.js', '../chrome-extension/content.js')
    build('src/extension/background.js', '../chrome-extension/background.js')
}
main()