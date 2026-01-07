// build.js
const esbuild = require('esbuild');

esbuild.build({
    entryPoints: ['src/main.js'],
    bundle: true,        // bundle all imports into one file
    platform: 'node',    // for Node.js
    outfile: 'dist/main.js',
    external: ['electron'], // <<< This tells esbuild not to bundle 'electron'
    minify: false,       // optional: set true for production
    sourcemap: true      // optional: for debugging
}).catch(() => process.exit(1));
