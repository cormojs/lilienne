import { assigned, sealed, filled } from './decorators'
import * as fs from 'fs';
import * as path from 'path';

export class Column {
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

    save(dir: string) {
        let d = new Date();
        let datetime = `${d.toLocaleDateString()}-${d.toLocaleTimeString()}`
            .replace(/\//g, "")
            .replace(/:/g, "");
        let filename = path.join(process.cwd(), dir, `${datetime}.json`);
        fs.writeFileSync(filename, JSON.stringify(this.statuses));
        console.log(`Toots saved to ${filename}`);
    }
}

@filled
@assigned
@sealed
export class Registration {
    id: number;
    client_id: string;
    client_secret: string;
    constructor(obj: object) { }
};

export type Stream = undefined;
export let Stream: Stream = undefined;

@assigned
@sealed
export class REST {
    update_min: number | null;
    auto_page: number;
    constructor(obj: object) { }
}

export let isREST = function(form: Stream | REST): form is REST {
    return form !== undefined && 'update_min' in form && 'auto_page' in form;
};

export type Query = { key?: string | boolean | number };

export type API<T> = {
    form: T,
    name: string,
    query: Query
};

export let isRESTAPI = function(api: API<REST | Stream>): api is API<REST> {
    return isREST(api.form);
}

export type Connection = { token: string, host: string }

@filled
@assigned
@sealed
export class Source {
    name: string;
    connection: Connection;
    filters: string[];
    api: API<REST | Stream>;
    constructor(obj: object) { }
}

@filled
@assigned
@sealed
export class Account {
    id: number;
    username: string;
    acct: string;
    display_name: string;
    locked: boolean;
    created_at: string;
    followers_count: number;
    following_count: number;
    statuses_count: number;
    note: string;
    url: string;
    avatar: string;
    avatar_static: string;
    header: string;
    header_static: string;
    get host(): string {
        let m = this.acct.match(/@(.+)$/);
        return m ? m[1] : "";
    }
}

export type MastNotification = object;
export type Delete = object;
export type Attachment = {
    id: number,
    type: 'image' | 'video' | 'gifv',
    url: string,
    remote_url: string,
    preview_url: string,
    text_url: string
};
export type Tag = {
    name: string,
    url: string
};
export type Status = {
    account: object,
    id: number,
    sensitive: boolean,
    media_attachments: Attachment[],
    reblog?: Status,
    url: string,
    tags: Tag[]
};