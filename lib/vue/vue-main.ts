import Vue from 'vue';
import { shell } from 'electron';
import {
    MastNotification, Delete, Status,
    Source, Stream, REST, API, isRESTAPI, Connection
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
        <button @click="saveToots()">Save</button>
        <button @click="deleteColumn(parseInt(index))">X</button>
        <form @submit.prevent="addSource(selectedAPI)">
          <select id="sourceSelector" v-model="selectedAPI">
            <option disabled value="">Select</option>
            <option v-for="(api, name, i) in $parent.app.config.allApi" :key="i" :value="api">{{ name }}</option>
          </select>
          <input type="submit" value="read" />          
        </form>
        <div class="header">{{ column.title }}</div>
        <div class="scrollable">
          <status v-for="(status, index) in column.statuses" :key="index"
                  :index="column.statuses.length - index" :status="status" :column-size="columnSize"></status>
        </div>
      </div>
    `,
    props: ['column', 'index'],
    data: function () {
        return {
            columnSize: {
                width: 300,
                height: 300
            },
            selectedAPI: null,
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
            let [c] = (<Column[]>this.$parent.columns).splice(index, 1);
            c.close();
        },
        addSource(api: API<REST | Stream>) {
            let column: Column = <Column>this['column'];
            let source: Source = new Source({
                name: "dummy",
                connection: column.connection,
                api: api
            });
            let event = new Worker(this.$parent.app).subscribe(source);
            if (isRESTAPI(api)) {
                event.listen({
                    update: [
                        column.statusHandler({
                            method: 'push',
                            filter: _ => true,
                            compare: (s1, s2) => s2.id - s1.id
                        }),
                        (..._: Status[]) => event.removeAllListeners()
                    ]
                }, true);
            } else {
                event.listen({
                    update: [
                        column.statusHandler({
                            method: 'unshift',
                            filter: _ => true,
                            keep: 1000
                        })
                    ]
                }, true);
            }
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
        columnNameInput: ''
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
        openAuth: function () {
            shell.openExternal(this['authUrl']);
            this['authUrl'] = null;
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
                        process.nextTick(() => (<App>this['app']).config.save())
                        this.$forceUpdate();
                    });
            } else {
                console.error('No authorization code input.')
            }
        },
        addSource: function (conn: { token: string, host: string }, api: API<REST | Stream>) {
            console.log(api);
            let source = {
                name: `${api.name} in ${conn.host}`,
                connection: conn,
                api: api
            };
            (<App>this['app']).config.sources.push(source);
        },
        addColumn: function(connection: Connection, filterName: string) {
            let app = <App>this['app'];
            let column = new Column(connection.host, connection, filterName);
            this['columns'].push(column);
        }
    },
    mounted: function () {
        this['initilize']();
    }
});