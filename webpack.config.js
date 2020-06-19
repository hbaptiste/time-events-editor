const path = require("path");
require("@babel/register");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
  mode: "development",
  entry: path.join(__dirname, "src", "index.js"),
  devServer: {
    contentBase: "./dist"
  },
  devtool: "inline-source-map",
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({ title: "Development", template: "src/index.html" })
  ],
  module: {
    rules: [
      {
        test: /\.test/,
        loader: "raw-loader"
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ["babel-loader"]
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      }
    ]
  },
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist")
  }
};
