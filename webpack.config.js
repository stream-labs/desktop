module.exports = {
  entry: {
    renderer: './app/app.js',
    updater: './updater/ui.js'
  },
  output: {
    path: __dirname + '/bundles',
    filename: '[name].js'
  },

  devtool: 'sourcemap',

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
        exclude: /node_modules/,
        options: {
          plugins: ['transform-decorators-legacy'],
          presets: ['stage-2']
        }
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
  }
}
