import { assigned, sealed, filled } from './decorators'
export class Column {
    public title: String;
    public id: Number;
    private _statuses: Status[] = [];

    public constructor(id: Number, title: String) {
        this.id = id;
        this.title = title;
    }

    public get statuses(): Status[] {
        return this._statuses;
    }

    public set statuses(s: Status[]) {
        this._statuses = s;
    }
}

@filled
@assigned
@sealed
export class Registration {
    id: number;
    client_id: string;
    client_secret: string;
    constructor(obj: object) {}
};

export type Stream = undefined;
export let Stream: Stream = null;

@assigned
@sealed
export class REST {
    update_min: number | null;
}

export let isREST = function (form: Stream | REST): form is REST {
    return form && 'update_min' in form;
};

export type API = {
    form: Stream | REST,
    name: string,
    query: { key?: string | boolean }
};

@filled
@assigned
@sealed
export class Source {
    name: string;
    connection: { token: string, host: string };
    filters: string[];
    api: API;
    constructor(obj: object) {}
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