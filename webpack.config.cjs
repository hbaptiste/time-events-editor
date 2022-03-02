const path = require("path");
require("@babel/register");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const HtmlWebpackPlugin = require("html-webpack-plugin");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ESLintPlugin = require("eslint-webpack-plugin");

module.exports = {
  mode: "development",
  entry: path.join(__dirname, "src", "index.js"),
  devServer: {
    contentBase: "./public",
  },
  devtool: "inline-source-map",
  plugins: [
    new ESLintPlugin({ fix: true, extensions: "ts" }),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({ title: "Development", template: "src/index.html" }),
  ],
  module: {
    rules: [
      {
        test: /\.test/,
        exclude: [/src\/test/],
        loader: "raw-loader",
      },
      {
        test: /\.(ts|js)x?$/,
        exclude: [/node_modules/, /src\/test/],
        loader: "babel-loader",
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      fs: false,
      assert: false,
      buffer: false,
      console: false,
      constants: false,
      crypto: false,
      domain: false,
      events: false,
      http: false,
      https: false,
      os: false,
      path: false,
      punycode: false,
      process: false, //require.resolve("process/browser"),
      querystring: false,
      stream: false,
      string_decoder: false,
      sys: false,
      timers: false,
      tty: false,
      url: false,
      util: false,
      vm: false,
      zlib: false,
    },
  },
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "public"),
  },
};
