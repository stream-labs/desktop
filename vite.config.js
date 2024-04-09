import { defineConfig } from 'vite';
import * as cp from 'child_process';
import * as path from 'path';
import vuePlugin from '@vitejs/plugin-vue2';
import commonjs from 'vite-plugin-commonjs';

const commit = cp.execSync('git rev-parse --short HEAD').toString().replace('\n', '');
const OUTPUT_DIR = path.join(__dirname, 'bundles');

const plugins = [];

plugins.push(vuePlugin());
plugins.push(commonjs());

// function nodeNativePlugin() {
//   return {
//     name: 'node-native-plugin',
//     config() {
//       return defineConfig({
//         build: {
//           rollupOptions: {
//             external
//           }
//         }
//       });
//     }
//     load(id) {
//       if (id.includes('.node')) {
//         console.log('NATIVE PLUGIN', id);
//         return "export default require('thiswillnotworklol')";
//       }
//     },
//   };
// }

// plugins.push(nodeNativePlugin());

/**
 * We use this plugin rather than the external option in the
 * Rollup config because it allows us to transform the imports
 * to modules that perform a node require and re-export it.
 */
function externalRequirePlugin(options) {
  return {
    name: 'external-require-plugin',
    // config() {
    //   const aliases = {};

    //   options.externals.forEach(module => {
    //     aliases[module] = `node-require:${module}`;
    //   });

    //   return defineConfig({
    //     resolve: {
    //       alias: aliases,
    //     },
    //   });
    // },
    // resolveId(source) {
    //   console.log('RESOLVE ID', source);
    //   if (options.externals.includes(source)) {
    //     return `node-require:${source}`;
    //   }
    // },
    // load(id) {
    //   if (id.startsWith('node-require:')) {
    //     console.log('EXTERNAL LOAD', id);
    //     // return `require("${id.substring(13)}")`;

    //     return 

    //     // throw new Error();

    //     // return `const mod = window['require'](${id.substring(13)}); module.exports = mod; module.exports.default = mod;`;
    //   }
    // },
    transform(code, id) {
      console.log('TRANSFORM', id);
      if (id.includes('child_process')) {
        throw new Error();
      }
      if (id.startsWith('node-require:')) {
        console.log('EXTERNAL TRANSFORM', code, id);
        throw new Error();
        return `require("${id.substring(13)}")`;
      }
    }
  };
}

const externals = [
  'obs-studio-node',
  'obs-studio-node/module',
  'font-manager',
  'color-picker',
  '@electron-remote',
  'realm',
  'aws-sdk',
  'asar',
  'backtrace-node',
  'node-fontinfo',
  'socket.io-client',
  'rimraf',
  'backtrace-js',
  'request',
  'archiver',
  'extract-zip',
  'fs-extra',
  'path',
  'child_process',
  'os',
  'stream',
  'assert',
  'fs',
  'process',
  'https',
  'crypto',
  'http',
  'electron',
  'net',
  'tls',
];

// plugins.push(externalRequirePlugin({ externals }));

export default defineConfig({
  define: {
    SLOBS_BUNDLE_ID: JSON.stringify(commit),
    SLD_SENTRY_FRONTEND_DSN: JSON.stringify(process.env.SLD_SENTRY_FRONTEND_DSN ?? ''),
    SLD_SENTRY_BACKEND_SERVER_URL: JSON.stringify(process.env.SLD_SENTRY_BACKEND_SERVER_URL ?? ''),
    SLD_SENTRY_BACKEND_SERVER_PREVIEW_URL: JSON.stringify(
      process.env.SLD_SENTRY_BACKEND_SERVER_PREVIEW_URL ?? '',
    ),
  },
  resolve: {
    alias: {
      services: '/app/services',
      components: '/app/components',
      'components-react': '/app/components-react',
      styles: '/app/styles',
      'app-services': '/app/app-services',
      'services-manager': '/app/services-manager',
    },
  },
  plugins,
  build: {
    manifest: true,
    minify: false, // TODO: Remove
    rollupOptions: {
      input: {
        renderer: './app/app.ts',
        // updater: './updater/mac/ui.js',
        // 'guest-api': './guest-api',
      },
      external: id => {
        // console.log('EXTERNAL?', id);
        return externals.includes(id);
      },
      output: {
        format: 'iife',
        globals: id => {
          console.log('EXTERNAL GLOBAL', id);
          if (externals.includes(id)) {
            return `require("${id}")`;
          }
        },
      }
    },
    outDir: OUTPUT_DIR,
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
});
