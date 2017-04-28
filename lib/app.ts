import { MastUtil } from './mastutil';
import {
    Registration,
    Account,
    Status,
    Source,
    Stream,
    REST,
    isRESTAPI,
    MastNotification,
    Delete,
    API,
    Connection,
    Query
} from './defs';
import AppConfig from './config';
import * as fs from 'fs';
import * as Mast from 'mastodon-api';
import { EventEmitter } from 'events';
import * as path from 'path'

export class App {
    public static timeout_ms = 60 * 1000;

    public config: AppConfig;
    public fetchedAccounts: { token?: { account: Account, host: string } } = {};




    public registerToHost(host: string): Promise<Registration> {
        return MastUtil
            .createApp(host, AppConfig.appName)
            .then(reg => {
                this.config.registrations[host] = reg;
                return reg;
            });
    }

    public constructor(config: AppConfig = new AppConfig()) {
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
            let m: Mast = new Mast({
                access_token: acc.token,
                timeout_ms: App.timeout_ms,
                api_url: 'https://' + acc.host + '/api/v1/'
            });
            return m
                .get("accounts/verify_credentials")
                .catch(e => console.log(`Error while fetching account: ${e}`))
                .then(res => {
                    if (!res) return;
                    let account = <Account>res.data;
                    console.log(`Fetched acccount: ${account.username}@${acc.host}`);
                    this.fetchedAccounts[acc.token] = {
                        host: acc.host,
                        account: account
                    };
                });
        }
    }

    public mastodon(conn: Connection, timeout_ms?: number): Mast {
        return new Mast({
            access_token: conn.token,
            timeout_ms: timeout_ms,
            api_url: 'https://' + conn.host + '/api/v1/'
        });
    }

    public subscribeREST(conn: Connection, api: API<REST>, callback: (err: any, ...ss: Status[]) => void) {
        let push = (query: Query): Promise<Query> => {
            return this
                .mastodon(conn, App.timeout_ms)
                .get(api.name, query)
                .catch(e => callback(e))
                .then<Query>((res: { resp: object, data: Status[] }) => {
                    if (!res || !res.data || res.data.length === 0) {
                        return new Promise<Query>((r, e) => r(undefined));
                    } else {
                        callback(null, ...res.data.map(d => new Status(d)))
                        return new Promise<Query>((resolve, reject) => {
                            let link = res.resp['headers']['link'];
                            let test = link ? link.match(/^<[^<>?]+\?max_id=([0-9]+)>/) : [];

                            if (test && test.length > 1) {
                                let id = parseInt(test[1]);
                                let q = query;
                                q['max_id'] = id;
                                return resolve(q);
                            } else {
                                return resolve(undefined);
                            }
                        });
                    }
                });
        }
        let rec = (query: Query, n: number): Promise<void> => {
            if (n === 0) {
                return new Promise<void>((r, _) => { });
            } else {
                return push(query).then<void>(newQuery => {
                    if (newQuery) {
                        setTimeout(() => rec(newQuery, n - 1), 1000);
                    } else {
                        console.log('Pagination Completed');
                    }
                });
            }
        };
        rec(api.query !== undefined ? api.query : {}, api.form.auto_page);
    }

    public subscribeStream(conn: Connection, api: API<Stream>): EventEmitter {
        return this.mastodon(conn).stream(api.name, api.query);
    }


            // s.on('message', (msg: { event: "update" | "delete" | "notification", data: string }) => {
            //     if (msg.event === "update") {
                // let selecteds = (<string[]>[]).concat(source.filters);

                    // let judge = selecteds.length !== 0
                    //     ? selecteds
                    //         .map(name => App.filters[name])
                    //         .reduce((bool: boolean, filter) => {
                    //             return bool || filter.fn(status);
                    //         }, false)
                    //     : true;
                    // if (judge) {
                    //     ss.unshift(status);
                    // } else {
                    //     console.log(`Dropped ${status.url}`);
                    // }
            //     } else {
            //         console.log(msg.event, JSON.parse(msg.data));
            //     }
            // });
}
