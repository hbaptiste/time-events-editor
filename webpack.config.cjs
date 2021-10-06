const path = require("path");
require("@babel/register");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
  mode: "development",
  entry: path.join(__dirname, "src", "index.js"),
  devServer: {
    contentBase: "./dist",
  },
  devtool: "inline-source-map",
  plugins: [
    new ESLintPlugin({ fix: true, extensions: "ts"}),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({ title: "Development", template: "src/index.html" }),
  ],
  module: {
    rules: [
      {
        test: /\.test/,
        loader: "raw-loader",
      },
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
};
