const CircularDependencyPlugin = require('circular-dependency-plugin');
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const plugins = [];


// uncomment to watch circular dependencies

// plugins.push(new CircularDependencyPlugin({
//   // exclude detection of files based on a RegExp
//   exclude: /a\.js|node_modules/,
//   // add errors to webpack instead of warnings
//   //failOnError: true
// }));


module.exports = {
  entry: {
    renderer: './app/app.ts',
    updater: './updater/ui.js',
    'guest-api': './guest-api'
  },
  output: {
    path: __dirname + '/bundles',
    filename: '[name].js'
  },

  devtool: 'sourcemap',

  target: 'electron-renderer',

  resolve: {
    extensions: ['.js', '.ts'],
    modules: [path.resolve(__dirname, 'app'), 'node_modules']
  },

  // We want to dynamically require native addons
  externals: {
    'font-manager': 'require("font-manager")',

    // Not actually a native addons, but for one reason or another
    // we don't want them compiled in our webpack bundle.
    'aws-sdk': 'require("aws-sdk")',
    'asar': 'require("asar")',
    'backtrace-node': 'require("backtrace-node")',
    'node-fontinfo': 'require("node-fontinfo")',
    'socket.io-client': 'require("socket.io-client")',
    'rimraf': 'require("rimraf")',
    'backtrace-js': 'require("backtrace-js")',
    'request': 'require("request")'
  },

  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          esModule: true,
          transformToRequire: {
            video: 'src',
            source: 'src'
          }
        }
      },
      {
        test: /\.ts$/,
        // TODO: use recommended by MS awesome-typescript-loader when the issue will be resoled
        // https://github.com/s-panferov/awesome-typescript-loader/issues/356
        loader: 'ts-loader',
        exclude: /node_modules|vue\/src/
      },
      {
        test: /\.ts$/,
        enforce: 'pre',
        loader: 'tslint-loader'
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.less$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1
            }
          },
          'less-loader'
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg|mp4|ico|wav|webm)(\?.*)?$/,
        loader: 'file-loader',
        options: {
          name: '[name]-[hash].[ext]',
          outputPath: 'media/',
          publicPath: 'bundles/media/'
        }
      },
      // Handles custom fonts. Currently used for icons.
      {
        test: /\.woff$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: 'fonts/',
          publicPath: 'bundles/fonts/'
        }
      }
    ]
  },

  optimization: {
    minimizer: [new UglifyJsPlugin({ uglifyOptions: { mangle: false } })]
  },

  plugins
};
