const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background/service_worker.ts',
    perplexity_content: './src/content/perplexity_content.ts',
    chatgpt_content: './src/content/chatgpt_content.ts',
    claude_content: './src/content/claude_content.ts',
    popup: './src/ui/popup.tsx',
    options: './src/ui/options.tsx',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: 'manifest.json', to: 'manifest.json' }],
    }),
    new HtmlWebpackPlugin({
      template: './src/ui/popup.html',
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
      template: './src/ui/options.html',
      filename: 'options.html',
      chunks: ['options'],
    }),
  ],
  optimization: {
    splitChunks: false,
  },
  devtool: 'cheap-module-source-map',
};
