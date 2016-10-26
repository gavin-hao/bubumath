'use strict';

var path = require('path');
var webpack = require('webpack');
// var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var StatsPlugin = require('stats-webpack-plugin');

module.exports = {
  context: path.join(__dirname, 'public'),
  // devtool: 'eval-source-map',
  entry: {
    main: './main',
    wx: './wx',
    vendors: ["jquery", "jquery-form", "jquery-validation", "noty"]
  },

  output: {
    path: path.join(__dirname, '/dist/'),
    filename: 'js/[name].js',
    publicPath: '/'
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    // new HtmlWebpackPlugin({
    //   template: 'public/index.tpl.html',
    //   inject: 'body',
    //   filename: 'index.html'
    // }),
    new webpack.optimize.CommonsChunkPlugin({ names: ['vendors'], filename: 'js/[name].js', minChunks: Infinity, children: false, }),
    new ExtractTextPlugin("css/[name].css", { allChunks: true }),
    new webpack.optimize.OccurenceOrderPlugin(),
    // new ExtractTextPlugin('[name]-[hash].min.css'),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false,
        screw_ie8: true
      }
    }),
    new StatsPlugin('webpack.stats.json', {
      source: false,
      modules: false
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
  ],
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: 'babel',
      query: {
        "presets": ["es2015", "stage-0", "react"]
      }
    },
    {
      test: /\.(jpg|jpeg|gif|png)$/,
      exclude: /node_modules/,
      loader: "file-loader?name=[path][name].[ext]"
    },
    { test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/, loader: "file-loader?name=[path][name].[ext]" },
    {
      test: /\.json?$/,
      loader: 'json'
    },
    {
      test: /\.css$/,
      loader: ExtractTextPlugin.extract('style-loader', 'css-loader?minimize')
    }]
  },
  postcss: [
    require('autoprefixer')
  ],
  resolve: {
    alias: {
      "jquery": "jquery/dist/jquery.js",
      "jquery-validation": "jquery-validation/dist/jquery.validate.js",
      // Make it so that 'require' finds the right file.
      // "pace": "PACE/pace.min.js",
      // "pace-theme": "PACE/themes/pink/pace-theme-minimal.css",
      // "cropper": "cropperjs/dist/cropper.min.js",
      // "croppercss": "cropperjs/dist/cropper.css",
      "jquery-form": "jquery-form/jquery.form.js",
      "noty": "noty/js/noty/packaged/jquery.noty.packaged.js",
      // "jquery-cookie": "jquery.cookie/jquery.cookie.js",

    },

    // Allow require('./blah') to require blah.jsx
    extensions: ['', '.js', '.jsx', '.json'],
    modulesDirectories: ['node_modules', 'bower_components', 'build'],
  },
  externals: {}
};