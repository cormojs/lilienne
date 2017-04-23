module.exports = {
    entry: ["./lib/mastutil.ts", "./lib/vue-main.ts"],
    target: "electron",
    output: {
        filename: "build.js",
        path: __dirname + "/build"
    },
    resolve: {
        extensions: [".ts", ".vue", ".js"],
        alias: {
            vue: 'vue/dist/vue.esm.js'
        }
    },
    module: {
        loaders: [
            { test: /\.vue$/, loader: 'vue-loader' },
            { test: /\.ts$/, loader: 'ts-loader'}
        ]
    }
};