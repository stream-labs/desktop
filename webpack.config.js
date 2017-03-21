var DashboardPlugin = require('webpack-dashboard/plugin');

var plugins = [];

if (process.env.WEBPACK_DASHBOARD) {
  plugins.push(new DashboardPlugin());
}

module.exports = {
  entry: {
    renderer: './app/app.js',
    main_helpers: './main_helpers.js'
  },
  output: {
    path: __dirname + '/bundles',
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
            'scss': 'vue-style-loader!css-loader!sass-loader',
            'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax'
          }
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
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
      }
    ]
  },
  plugins: plugins
}
