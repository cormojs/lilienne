const ExtractTextPlugin = require("extract-text-webpack-plugin");
const extractSass = new ExtractTextPlugin({
    filename: "[name].css",
    disable: false
});

module.exports = [{
    entry: ["./lib/vue-main.ts", "./css/main.scss"],
    target: "electron",
    output: {
        filename: "build.js",
        path: __dirname + "/build"
    },
    resolve: {
        extensions: [".ts", ".vue", ".js", ".scss"],
        alias: {
            vue: 'vue/dist/vue.esm.js'
        }
    },
    module: {
        loaders: [
            { test: /\.vue$/, loader: 'vue-loader' },
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: {
                    appendTsSuffixTo: [/\.vue$/]
                }
            },
            {
                test: /\.scss$/,
                use: extractSass.extract({
                    use: ["css-loader", "sass-loader"]
                })
            }
        ]
    },
    plugins: [
        extractSass
    ]
}];