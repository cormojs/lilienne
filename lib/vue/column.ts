import { Status, Connection } from '../app/defs';
import AppConfig from '../app/config';
import * as fs from 'fs';
import * as path from 'path';

export type ColumnSettings = {
    method: 'push' | 'unshift' | 'splice',
    filter?: (s: Status) => boolean,
    compare?: (s1: Status, s2: Status) => number,
    keep?: number
};

export class Column {
    title: string;
    id: number;
    connection: Connection;
    filterName: string;
    private _statuses: Status[];

    constructor(o: { title: string, connection: Connection, filterName: string }) {
        this.title = o.title;
        this.connection = o.connection;
        this._statuses = [];
        this.filterName = o.filterName;
    }

    get statuses(): Status[] {
        return this._statuses;
    }

    save(dir: string = AppConfig.saveDir) {
        let d = new Date();
        let datetime = `${d.toLocaleDateString()}-${d.toLocaleTimeString()}`
            .replace(/\//g, "")
            .replace(/:/g, "");
        let filename = path.join(process.cwd(), dir, `${datetime}.json`);
        fs.writeFileSync(filename, JSON.stringify(this._statuses), { encoding: 'utf8' });
        console.log(`Toots saved to ${filename}`, this._statuses);
    }

    close() {
        delete this._statuses;
    }

    statusHandler(option: ColumnSettings): (...ss: Status[]) => void {
        return (...ss: Status[]) => {
            let statuses = ss;
            let filter = AppConfig.filters[this.filterName];
            if (filter) {
                statuses = statuses.filter(s => filter(s.actual));
            }
            if (option.compare) {
                statuses = statuses.sort(option.compare);
            }
            for (let status of statuses) {
                if (option.method === 'push') {
                    this._statuses.push(status);
                } else if (option.method === 'unshift') {
                    this._statuses.unshift(status);
                } else if (option.method === 'splice') {
                    this._statuses.splice(status.id, 0, status);
                }
            }
            if (option.keep) {
                let len = this.statuses.length;
                if (len > option.keep) {
                    this._statuses.splice(option.keep - 1, len - option.keep);
                }
            }
        };
    }
}
