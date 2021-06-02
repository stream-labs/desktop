const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.base.config.js');
const TerserPlugin = require('terser-webpack-plugin');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, 'bundles');

// Used by bundle updater to validate integrity of downloaded files
class WebpackManifestChecksumPlugin {
  apply(compiler) {
    const assetChecksums = {};

    compiler.hooks.assetEmitted.tap('WebpackManifestChecksumPlugin', (file, { content }) => {
      if (file.match(/\.js$/)) {
        const hash = crypto.createHash('md5');
        hash.update(content);
        assetChecksums[file] = hash.digest('hex');
      }
    });

    compiler.hooks.done.tap('WebpackManifestChecksumPlugin', () => {
      const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
      const content = fs.readFileSync(manifestPath);
      const parsed = JSON.parse(content.toString());
      // We add checksums for these files only
      const checksumFiles = ['renderer.js', 'vendors~renderer.js'];

      parsed['checksums'] = {};

      checksumFiles.forEach(cfile => {
        if (!assetChecksums[parsed[cfile]]) {
          throw new Error(`Checksum missing for file ${cfile}`);
        }

        parsed['checksums'][parsed[cfile]] = assetChecksums[parsed[cfile]];
      });

      fs.writeFileSync(manifestPath, JSON.stringify(parsed, null, 2));
    });
  }
}

module.exports = merge(baseConfig, {
  output: {
    filename: chunkData => {
      return chunkData.chunk.name.match(/renderer/) ? '[name].[contenthash].js' : '[name].js';
    },
    chunkFilename: '[name].[contenthash].js',
  },

  mode: 'production',
  devtool: 'source-map',

  optimization: {
    concatenateModules: false,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          mangle: false,
          keep_classnames: true,
        },
      }),
    ],
    usedExports: true,
  },

  plugins: [new WebpackManifestChecksumPlugin()],
});
