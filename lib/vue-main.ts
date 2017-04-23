import Vue from 'vue';
import { Column, MastNotification, Delete, Status, Source, Stream, API } from './defs';
import { MastUtil } from './mastutil';
import * as fs from 'fs';
import * as path from 'path';
import { App } from './app';
import { AppConfig } from './config';

let statusApp = require('./templates/status');
let configFile = path.join(process.cwd(), 'lilienne.json');

let vm = new Vue({
    el: "#lilienne",
    data: {
        columns: [],
        app: new App(new AppConfig(configFile)),
        authUrl: null,
        hostInput: '',
        authCode: '',
        showAddColumn: false,
        selectedConnection: null,
        selectedAPI: null,
        selectedFilters: [],
        columnNameInput: '',
        selectedSources: [],
        filters: App.filters,
        availableAPI: App.availableAPI
    },
    computed: {
        getAccounts: function () {
            return (<App>this['app']).fetchedAccounts;
        },
        getSources: function () {
            return (<App>this['app']).config.sources;
        }
    },
    components: {
        status: statusApp
    },
    methods: {
        initilize: function () {
            window['debug'] = { streams: {} };
            let app = <App>this['app'];
            app.config.accounts
                .reduce((promise, acc) => {
                    return promise.then(() => app.fetchAccount(acc));
                }, new Promise<any>((r, e) => r()))
                .then(() => { 
                    this['showAddColumn'] = true;
                });
        },
        saveConfig: function () {
            (<App>this['app']).config.save(configFile);
            console.log("Configuration Saved");
        },
        saveToots: function (column: Column) {
            let d = new Date();
            let datetime = `${d.toLocaleDateString()}-${d.toLocaleTimeString()}`
                .replace(/\//g, "")
                .replace(/:/g, "");
            let filename = path.join(process.cwd(), "/saved/", `${datetime}.json`);
            fs.writeFileSync(filename, JSON.stringify(column.statuses));
            console.log(`Toots saved to ${filename}`);
        },
        register: function () {
            let showAuthUrl = reg => {
                if (reg) {
                    console.log(`Registration Complete: ${reg}`);
                    MastUtil
                        .getAuthUrl(reg, host)
                        .then(url => {
                            console.log(`Go to url: ${url}`);
                            this['authUrl'] = url;
                        })
                }
            };
            let host = this['hostInput'];
            if (host) {
                let app = <App>this['app'];
                let reg = app.config.registrations[host];
                if (reg) {
                    showAuthUrl(reg);
                } else {
                    app
                        .registerToHost(host)
                        .catch(err => {
                            console.error(`Registration Error: ${err}`);
                        })
                        .then(reg => showAuthUrl(reg));
                }
            } else {
                console.error('No host name input.');
            }
        },
        addAccount: function () {
            let code = this['authCode'];
            let host = this['hostInput'];
            if (code && host) {
                let app = (<App>this['app']);
                app
                    .addAccount(host, code)
                    .catch(err => console.error(`Add account error: ${err}`))
                    .then(acc => {
                        if (acc) {
                            console.log(`Added an account successfully: ${acc.token} of ${acc.host}`);
                            app.fetchAccount(acc);
                        } else {
                            console.error(`Couldn't get access token.`);
                        }
                    });
            } else {
                1
                console.error('No authorization code input.')
            }
        },
        addSource: function (conn: { token: string, host: string }, api: API, filters: string[]) {
            let source = {
                name: `${api.name} in ${conn.host}`,
                connection: conn,
                api: api,
                filters: filters
            };
            (<App>this['app']).config.sources.push(source);
        },
        addColumn: function (name: string, sources: Source[]) {
            let app = <App>this['app'];
            let ss = [];
            this['columns'].push({
                title: name,
                statuses: ss
            });
            for (let source of sources) {
                console.log(source);
                window['debug'].streams[source.name] = app.subscribe(source, ss);
            }
        }
    },
    mounted: function () {
        this['initilize']();
    }
});