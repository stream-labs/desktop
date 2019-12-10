const merge = require('webpack-merge');
const baseConfig = require('./base.config.js');

module.exports = merge.smart(baseConfig, {
  entry: {
    renderer: './app/app.ts',
    updater: './updater/ui.js',
    'guest-api': './guest-api'
  },

  watchOptions: { ignored: /node_modules/ },

  optimization: {
    usedExports: true,
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'awesome-typescript-loader',
        options: {
          useCache: true,
          reportFiles: ['app/services/core/*.ts'],
          strictNullChecks: true
        },
        exclude: /node_modules|vue\/src/
      },
    ]
  }
});
