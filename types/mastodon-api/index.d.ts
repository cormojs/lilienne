declare module 'mastodon-api' {
    import { EventEmitter } from 'events';
    type Response = Promise<{ resp: object, data: object }>
    namespace Mastodon {
        export function createOAuthApp(url?: string, clientName?: string, scopes?: string, redirectUri?: string): Promise<object>;
        export function getAuthorizationUrl(id: string, secrect: string, path: string, scope: string, redirectUri: string): Promise<string>;
        export function getAccessToken(id: string, secret: string, code: string, path: string): Promise<string>

    }
    class Mastodon {
        constructor(config: object);
        get(path: string, params?: object, callback?: Function): Response;
        post(path: string, params?: object, callback?: Function): Response;

        delete(path: string, params?: object, callback?: Function): Response;

        request(method: string, path: string, params?: object, callback?: Function): Response;
        stream(path: string, params?: object): EventEmitter
    }
    export = Mastodon;

}