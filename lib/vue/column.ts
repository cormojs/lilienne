import { Status, Source } from '../app/defs';
import AppConfig from '../app/config';
import * as fs from 'fs';
import * as path from 'path';

export type ColumnSettings = {
    method: 'push' | 'unshift' | 'splice',
    filter?: (s: Status) => boolean,
    compare?: (s1: Status, s2: Status) => number
};

export class Column {
    title: string;
    id: number;
    source: Source;
    private _statuses: Status[] = [];

    constructor(title: string, source: Source) {
        this.title = title;
        this.source = source;
    }

    get statuses(): Status[] {
        return this._statuses;
    }

    set statuses(s: Status[]) {
        this._statuses = s;
    }

    save(dir: string = AppConfig.saveDir) {
        let d = new Date();
        let datetime = `${d.toLocaleDateString()}-${d.toLocaleTimeString()}`
            .replace(/\//g, "")
            .replace(/:/g, "");
        let filename = path.join(process.cwd(), dir, `${datetime}.json`);
        fs.writeFileSync(filename, JSON.stringify(this.statuses));
        console.log(`Toots saved to ${filename}`);
    }

    statusHandler(option: ColumnSettings): (...ss: Status[]) => void {
        return (...ss: Status[]) => {
            let statuses = ss;
            if (option.filter) {
                statuses = statuses.filter(option.filter);
            }
            if (option.compare) {
                statuses = statuses.sort(option.compare);
            }
            for (let status of statuses) {
                if (option.method === 'push') {
                    this.statuses.push(status);
                } else if (option.method === 'unshift') {
                    this.statuses.unshift(status);
                } else if (option.method === 'splice') {
                    this.statuses.splice(status.id, 0, status);
                }
            }
        };
    }
}