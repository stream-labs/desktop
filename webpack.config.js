var DashboardPlugin = require('webpack-dashboard/plugin');

var plugins = [];

if (process.env.WEBPACK_DASHBOARD) {
  plugins.push(new DashboardPlugin());
}

module.exports = {
  entry: './app/app.js',
  output: {
    path: __dirname + '/build',
    filename: 'slobs.js'
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
