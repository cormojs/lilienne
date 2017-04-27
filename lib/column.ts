import { Status } from './defs';
import AppConfig from './config';
import * as fs from 'fs';
import * as path from 'path';

export default class Column {
    title: string;
    id: number;
    private _statuses: Status[] = [];

    constructor(title: string) {
        this.title = title;
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
}