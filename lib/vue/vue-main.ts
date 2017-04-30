import Vue from 'vue';
import {
    MastNotification, Delete, Status,
    Source, Stream, REST, API, isRESTAPI
} from '../app/defs';
import { Column, ColumnSettings } from './column';
import { MastUtil } from '../app/mastutil';
import { App } from '../app/app';
import AppConfig from '../app/config';
import Worker from '../app/worker';
import filters from '../app/filters';


let statusApp = require('./status');
let columnApp = {
    components: {
        status: statusApp,
    },
    template: `
      <div class="column" :value="columnSize" @resize="() => { columnSize = getSize() }" >
        <button @click="saveToots()">Save toots</button>
        <button @click="deleteColumn(index)">Delete column</button>
        <div class="header">{{ column.title }}</div>
        <div class="scrollable">
          <status v-for="(status, index) in column.statuses" :key="index"
                  :index="index" :status="status" :column-size="columnSize"></status>
        </div>
      </div>
    `,
    props: ['column', 'index'],
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
        saveToots() {
            (<Column>this['column']).save();
        },
        deleteColumn(index: number) {
            (<Column[]>this.$parent['column']).splice(index, 0);
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
        selectedFilter: _ => true,
        columnNameInput: '',
        selectedSource: null
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
                            return app.fetchAccount(acc);
                        } else {
                            console.error(`Couldn't get access token.`);
                        }
                    }).then(_ => {
                        this.$forceUpdate();
                    });
            } else {
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
        addColumn: function (name: string, source: Source, selectedFilter: Function) {
            let app = <App>this['app'];
            let column = new Column(name, source);
            this['columns'].push(column);
            let unique = (s: Status) => column.statuses.every(s1 => s1.id !== s.id);
            let [{ }, hasMedia] = filters.hasMedia;
            let filter = (s: Status) => [selectedFilter].every(f => f(s.actual))
            let columnSettings: ColumnSettings =
                isRESTAPI(source.api)
                    ? {
                        method: 'push',
                        filter: filter,
                        compare: (s1, s2) => s2.id - s1.id
                    } : {
                        method: 'unshift',
                        filter: filter
                    };
            let worker = new Worker(app)
            worker.subscribe({
                api: source.api,
                conn: source.connection,
                handlers: {
                    update: [
                        column.statusHandler(columnSettings),
                        Worker.consoleLogger()
                    ]
                }
            });
        }
    },
    mounted: function () {
        this['initilize']();
    }
});