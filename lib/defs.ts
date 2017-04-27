import { assigned, sealed, filled, Asserted, NotNull } from './decorators'
import * as fs from 'fs';
import * as path from 'path';
import * as sanitizeHtml from 'sanitize-html';


@filled
@assigned
@sealed
export class Registration {
    id: number;
    client_id: string;
    client_secret: string;
    constructor(obj: object) { }
};

export type Stream = any;
export let Stream: Stream = null;

@assigned
@sealed
export class REST {
    update_min: number | null;
    auto_page: number;
    constructor(obj: object) { }
}

export let isREST = function (form: any): form is REST {
    return form !== null && form !== undefined && 'update_min' in form && 'auto_page' in form;
};

export type Query = { key?: string | boolean | number };

export class API<T> {
    form: T;
    name: string;
    query: Query;
};

export let isRESTAPI = function (api: API<REST | Stream>): api is API<REST> {
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

@Asserted
// @filled
@assigned
export class Account {
    @NotNull
    id: number;
    @NotNull
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
    constructor(obj: object) {}
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


@Asserted
// @filled
@assigned
export class Status {
    @NotNull
    account: Account;
    @NotNull
    id: number;
    sensitive: boolean;
    media_attachments: Attachment[];
    reblog?: Status;
    @NotNull
    url: string;
    tags: Tag[];
    content: string;

    constructor(obj: object) {
    }
    get contentSanitized(): string {
         return sanitizeHtml(this.ownStatus.content, {
             allowedTags: ['a'],
             allowedAttributes: {
                 'a': [ 'href' ]
             }
         });
     }

     get ownStatus(): Status {
         return this.reblog ? new Status(this.reblog) : this;
     }
};