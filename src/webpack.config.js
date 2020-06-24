const webpack = require('webpack');
const path = require('path');
const jsonLoader = require('json-loader');
const Dotenv = require('dotenv-webpack');

module.exports = {

    entry: './src/background.js',
    output: {

        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    node: {
        fs: 'empty',
        net: 'empty',
        tls: 'empty'
      },
    plugins: [
        new Dotenv()
    ]
    /*target: 'node'
    module: {
    externals: {
        "request": "request"
    },

        rules: [
            {test: /\.json$/, use: 'json-loader'}
        ]
    },
    resolve: {

        extensions: ['webpack.js', '.web.js', '.js']
    },*/
};