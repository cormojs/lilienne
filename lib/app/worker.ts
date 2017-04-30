import { EventEmitter } from 'events';

import { App } from './app';
import {
    Connection, REST,
    Stream, API, Status, MastNotification, Delete, isRESTAPI
} from './defs';

export type Subscribe = {
    api: API<REST | Stream>,
    conn: Connection
    handlers: {
        update?: [(...ss: Status[]) => void],
        errror?: [(e: any) => void],
        notification?: [(n: MastNotification) => void],
        delete?: [(d: Delete) => void]
    }
}

export default class Worker {
    _app: App;
    _events: EventEmitter[] = [];

    constructor(app: App = new App()) {
        this._app = app;
    }

    subscribe({ api, handlers, conn }: Subscribe): EventEmitter {
        let event = new EventEmitter();

        for (let name in handlers) {
            for (let fn of handlers[name]) {
                event.on(name, fn);
            }
        }

        if (isRESTAPI(api)) {
            this._app.subscribeREST(conn, api, function(err: any, ...ss: Status[]) {
                if (err) {
                    event.emit('error', err);
                } else {
                    event.emit('update', ...ss);
                }
            });
        } else {
            let stream = this._app
                .mastodon(conn)
                .stream(api.name, api.query);
            stream.on('error', e => event.emit('error', e));
            stream.on('update', (msg: { data: string }) => {
                console.debug("update", msg);
                let json = JSON.parse(msg.data);
                event.emit('update', new Status(json))
            });
            stream.on('delete', d => event.emit('delete', d));
            stream.on('notification', n => event.emit('notification', n));
        }

        this._events.push(event);
        return event;
    };

    // still unimplemented
    static fileLogger(o: { keep: number, rotate: number, dir: string })
        : (...ss: Status[]) => void {
        let statuses: { [k: string]: Status } = {};
        let buffer: { [k: string]: Status } = {};

        return function(...newlyArrived: Status[]) {
            for (let status of newlyArrived) {
                buffer[status.id] = status;
            }
            if (Object.keys(buffer).length > o.keep) {
                for (let id in buffer) {
                    statuses[id] = buffer[id];
                }
                buffer = {};
            }
        };
    }

    static consoleLogger<T>(): (...args: T[]) => void {
        return function(...args: T[]) {
            console.log(`${args.length} messages received`);
        }
    }
}

