const path = require('path');

module.exports = function(env, { mode }) {
  const production = mode === 'production';
  return {
    mode: production ? 'production' : 'development',
    devtool: production ? '' : 'inline-source-map',
    entry: {
      app: ['./src/overhide-widgets.ts']
    },
    output: {
      filename: 'overhide-widgets.js'
    },
    resolve: {
      extensions: ['.ts', '.js'],
      modules: ['src', 'node_modules']
    },
    devServer: {
      port: 9000,
      historyApiFallback: true,
      writeToDisk: true,
      open: !process.env.CI,
      lazy: false,
      contentBase: [__dirname, path.join(__dirname, 'dev-front-end'), path.join(__dirname, 'src')]
    },
    module: {
      rules: [
        {
          test: /\.ts$/i,
          use: [
            {
              loader: 'ts-loader'
            }
          ],
          exclude: /node_modules/
        },
        {
          test: /\.(css|svg)$/i,
          use: [
            {
              loader: "raw-loader",
              options: {
                esModule: false
              }
            }
          ],
        }      
      ]
    }
  }
}