var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: {
    'home': './src/page/Home/Home.js',
  },
  output: {
    path: path.resolve(__dirname,"build"),
    filename: '[name].js',//也可以动态生成文件名 filename:'[name].js',将根据entry中的key生成名字
  },
  module: {
    loaders: [{
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query:{
          presets: ['es2015','react']
        }
      },
      { 
        test: /\.css$/, 
        loader: 'style-loader!css-loader' 
      }
    ]
  },
  devServer: {
      inline: true,
      port: 3000,
      contentBase: "./build"
  },
  resolve: {
      alias: {
          jquery: "jquery/src/jquery"
      }
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      antd:"antd"
    }),
  ]
};
