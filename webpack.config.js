const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'lib'),
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  externalsPresets: { node: true }, // in order to ignore built-in modules like path, fs, etc.
  externals: [nodeExternals()],
};
