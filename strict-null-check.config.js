const merge = require('webpack-merge');
const baseConfig = require('./base.config.js');
const path = require('path');
const fs = require('fs');

// read all files eligible for the strictNulls checking
const filesPath = 'strict-null-check-files';
const files = fs.readdirSync(filesPath);
const tsFiles = [];
const tsxFiles = [];
files.forEach(file => {
  const json = JSON.parse(fs.readFileSync(`${filesPath}/${file}`));
  if (json.ts) tsFiles.push(...json.ts);
  if (json.tsx) tsxFiles.push(...json.tsx);
});


module.exports = merge.smart(baseConfig, {
  entry: {
    renderer: './app/app.ts',
    updater: './updater/ui.js',
    'guest-api': './guest-api'
  },

  mode: 'development',
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
          reportFiles: [
            ...tsFiles
          ],
          strictNullChecks: true
        },
        exclude: /node_modules|vue\/src/
      },
      {
        test: /\.tsx$/,
        include: path.resolve(__dirname, 'app/components'),
        loader: [
          'babel-loader',
          {
            loader: 'awesome-typescript-loader',
            options: {
              forceIsolatedModules: true,
              reportFiles: [
                ...tsxFiles
              ],
              configFileName: 'tsxconfig.json',
              instance: 'tsx-loader'
            }
          }
        ],
        exclude: /node_modules/,
      },
    ],
  }
});
