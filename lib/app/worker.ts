import { EventEmitter } from "events";

import { App } from "./app";
import {
  Connection,
  REST,
  Source,
  Stream,
  API,
  Status,
  MastNotification,
  Delete,
  isRESTAPI,
} from "./defs";
import { MastUtil } from "./mastutil";

export type Handlers = {
  update?: ((...ss: Status[]) => void)[];
  errror?: ((e: any) => void)[];
  notification?: ((n: MastNotification) => void)[];
  delete?: ((d: Delete) => void)[];
};

export type Subscribe = {
  source: Source;
  handlers: Handlers;
};

class Subscriber extends EventEmitter {
  constructor() {
    super();
  }
  listen(handlers: Handlers, once: boolean = false) {
    for (let name in handlers) {
      for (let fn of handlers[name]) {
        if (once) {
          this.once(name, fn);
        } else {
          this.on(name, fn);
        }
      }
    }
  }
}

export default class Worker {
  _app: App;
  _events: Subscriber[] = [];

  constructor(app: App = new App()) {
    this._app = app;
  }

  subscribe(source: Source): Subscriber {
    let api = source.api;
    let conn = source.connection;
    let event = new Subscriber();

    if (isRESTAPI(api)) {
      this._app.subscribeREST(conn, api, function (err: any, ...ss: Status[]) {
        if (err) {
          event.emit("error", err);
        } else {
          event.emit("update", ...ss);
        }
      });
    } else {
      // Get the stream emitter from App's implementation
      let stream = this._app.subscribeStream(conn, api);
      
      // Forward all events from the stream to our event emitter
      stream.on("error", (e) => event.emit("error", e));
      stream.on("update", (status: Status) => event.emit("update", status));
      stream.on("delete", (d) => event.emit("delete", d));
      stream.on("notification", (n) => event.emit("notification", n));
    }

    this._events.push(event);
    return event;
  }

  // still unimplemented
  static fileLogger(o: {
    keep: number;
    rotate: number;
    dir: string;
  }): (...ss: Status[]) => void {
    let statuses: { [k: string]: Status } = {};
    let buffer: { [k: string]: Status } = {};

    return function (...newlyArrived: Status[]) {
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
    return function (...args: T[]) {
      console.log(`${args.length} messages received`);
    };
  }
}
