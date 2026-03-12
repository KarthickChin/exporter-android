const path = require("path")
const TerserPlugin = require("terser-webpack-plugin")

module.exports = {
  entry: "./src/index.ts",
  target: "node",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "build.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
}
