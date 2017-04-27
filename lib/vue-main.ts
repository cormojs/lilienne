import Vue from 'vue';
import { MastNotification, Delete, Status, Source, Stream, REST, API } from './defs';
import Column from './column';
import { MastUtil } from './mastutil';
import { App } from './app';
import AppConfig from './config';


let statusApp = require('./templates/status');
let columnApp = {
    components: {
        status: statusApp,
    },
    template: `
      <div class="column" :value="columnSize" @resize="() => { columnSize = getSize() }" >
        <button @click="saveToots(column)">Save Toots</button>
        <div class="header">{{ column.title }}</div>
        <div class="scrollable">
          <status v-for="(status, index) in column.statuses" :key="index"
                  :index="index" :status="status" :column-size="columnSize"></status>
        </div>
      </div>
    `,
    props: ['column'],
    data: function () {
        return {
            columnSize: {
                width: 300,
                height: 300
            }
        };
    },
    methods: {
        getSize() {
            console.log('columnApp resized');
            let el = (<Vue>this).$el;
            return {
                width: el.offsetWidth,
                height: el.offsetHeight
            };
        },
        saveToots: function () {
            (<Column>this['column']).save();
        }
    }
};

let vm = new Vue({
    el: "#lilienne",
    data: {
        columns: [],
        app: new App(),
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
        column: columnApp
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
            (<App>this['app']).config.save();
            console.log("Configuration Saved");
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
        addSource: function (conn: { token: string, host: string }, api: API<REST | Stream>, filters: string[]) {
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
            let column = new Column(name);
            this['columns'].push(column);
            for (let source of sources) {
                window['debug'].streams[source.name] = app.subscribe(source, column.statuses);
            }
        }
    },
    mounted: function () {
        this['initilize']();
    }
});