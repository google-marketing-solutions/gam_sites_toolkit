/**
 * @license
 * Copyright 2024 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const path = require('path');
const GasPlugin = require('gas-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');

module.exports = {
  mode : 'production',
  entry : {
    import_dialog : path.resolve(__dirname, 'app/assets/import_dialog.ts'),
    app : path.resolve(__dirname, 'app/app.ts')
  },
  module : {
    rules :
          [
            {
              test : /\.tsx?$/,
              use : 'ts-loader',
              exclude : /node_modules/,
            },
            {test : /\.css$/, use : ['style-loader', 'css-loader']},
            {
              test : /\.html$/,
              loader : 'html-loader',
            },
            {
              test : /\.m?js/,
              resolve : {
                fullySpecified : false,
              },
            },
          ],
  },
  resolve : {
    extensions : ['.tsx', '.ts', '.js'],
  },
  output : {
    libraryTarget : 'this',
    filename : '[name]_bin.js',
    path : path.resolve(__dirname, 'build'),
  },
  plugins :
  [
    new GasPlugin({autoGlobalExportsFiles : ['**/*.ts']}),
    new CopyPlugin({patterns : ['appsscript.json']}),
    new HtmlWebpackPlugin({
      template : path.resolve(__dirname, 'app/assets/import_dialog.html'),
      filename : 'import_dialog.html',
      inject : 'body',
      chunks : ['import_dialog'],
      inlineSource : '.(js|css)$'
    }),
    new HtmlInlineScriptPlugin({
      htmlMatchPattern : [/\.html$/],
    }),
  ]
};