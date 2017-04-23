import { MastUtil } from './mastutil';
import {
    Registration,
    Account,
    Status,
    Source,
    Stream,
    REST,
    isREST,
    MastNotification,
    Delete,
    API
} from './defs';
import { AppConfig } from './config';
import * as fs from 'fs';
import * as Mast from 'mastodon-api';
import { EventEmitter } from 'events';


export class App {
    public static appName = "Lilienne";
    public static timeout_ms = 60 * 1000;
    public static filters = {
        lolie: {
            fn: (s: Status) => s.tags && s.tags.some((tag) => tag.name === "lolie"),
            description: "Select #lolie"
        },
        sensitive: {
            fn: (s: Status) => s.sensitive === true,
            description: "Select sensitvie tweets"
        }
    }

    public static availableAPI: { name?: API } = <{ name?: API }>{
        "User Stream": {
            form: Stream,
            name: "streaming/user",
            query: {}
        },
        "Public Stream": {
            form: Stream,
            name: "streaming/public",
            query: {}
        },
        "REST Public(local) per 1 min": {
            form: { update_min: 1 },
            name: "timelines/public",
            query: { "local": true }
        },
        "REST Home(once)": {
            form: { update_min: null },
            name: "timelines/home"
        },
        "REST cormojs": {
            form: { update_min: null },
            name: "accounts/7832/statuses"
        },
        "REST Favs": {
            form: { update_min: null },
            name: "favourites"
        }
    };

    public config: AppConfig;
    public fetchedAccounts: { token?: { account: Account, host: string } } = {};




    public registerToHost(host: string): Promise<Registration> {
        return MastUtil
            .createApp(host, App.appName)
            .then(reg => {
                this.config.registrations[host] = reg;
                return reg;
            });
    }

    public constructor(config: AppConfig) {
        this.config = config;
    }

    public addAccount(host: string, code: string): Promise<{ host: string, token: string }> {
        return MastUtil
            .getAccessToken(this.config.registrations[host], host, code)
            .then(token => {
                if (token) {
                    let acc = {
                        host: host,
                        token: token
                    };
                    this.config.accounts.push(acc);
                    return acc;
                } else {
                    return null;
                }
            })
    }


    public fetchAccount(acc: { token: string, host: string }) {
        console.log(`Fetching ${acc.token} of ${acc.host}`);
        let fetched: { host: string, account: Account } = this.fetchedAccounts[acc.token]
        if (!fetched) {
            return new Mast({
                access_token: acc.token,
                timeout_ms: App.timeout_ms,
                api_url: 'https://' + acc.host + '/api/v1/'
            })
                .get("accounts/verify_credentials")
                .catch(e => console.log(`Error while fetching account: ${e}`))
                .then(res => {
                    let account = <Account>res.data;
                    console.log(`Fetched acccount: ${account.username}@${acc.host}`);
                    this.fetchedAccounts[acc.token] = {
                        host: acc.host,
                        account: account
                    };
                });
        }
    }

    public mastodon(conn: { token: string, host: string }, timeout_ms: number): Mast {
        return new Mast({
            access_token: conn.token,
            timeout_ms: timeout_ms,
            api_url: 'https://' + conn.host + '/api/v1/'
        });
    }

    public subscribe(source: Source, ss: Status[]): EventEmitter {
        if (isREST(source.api.form)) {
            let push = () => {
                this
                    .mastodon(source.connection, App.timeout_ms)
                    .get(source.api.name, source.api.query)
                    .catch(e => console.error(e))
                    .then(res => {
                        console.log(res);
                        for (let s of res.data.sort((s1, s2) => s1.id - s2.id)) {
                            if (!ss.some(_s => s.id === _s.id)) {
                                ss.unshift(s);
                            }
                        }
                    });
            };
            let update_min = source.api.form.update_min;
            if (update_min) {
                setInterval(push, update_min * 60 * 1000);
            } else {
                push();
            }
            return undefined;
        } else {
            let s = this
                .mastodon(source.connection, undefined)
                .stream(source.api.name, source.api.query);
            s.on('error', e => console.error(`Streaming Error: ${e}`));
            s.on('message', obj => console.log(obj));
            s.on('message', (msg: { event: "update" | "delete" | "notification", data: (Status | MastNotification | Delete) }) => {
                if (msg.event === "update") {
                    let _status = <Status>msg.data;
                    let status = _status.reblog ? _status.reblog : _status;
                    let selecteds = [].concat(source.filters);
                    let judge = selecteds.length !== 0
                        ? selecteds
                            .map(name => App.filters[name])
                            .reduce((bool: boolean, filter) => {
                                return bool || filter.fn(status);
                            }, false)
                        : true;
                    if (judge) {
                        ss.unshift(status);
                    } else {
                        console.log(`Dropped ${status.url}`);
                    }
                } else {
                    console.log(msg.event);
                }
            });
            return s;
        }
    }
}
