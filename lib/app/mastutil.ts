import * as Mast from 'mastodon-api';
import * as fs from 'fs';
import { EventEmitter } from 'events';
import { Registration, Connection } from './defs';


export namespace MastUtil {
    export const defaultRedirect = "urn:ietf:wg:oauth:2.0:oob";
    export const apiBase = '/api/v1/';

    export function createApp(host: string, name: string, scopes = "read write follow", redirectUri = defaultRedirect)
        : Promise<Registration> {
        return Mast
            .createOAuthApp('https://' + host + apiBase + 'apps', name, scopes, redirectUri)
            .then(o => new Registration(o))
    }

    export function getAuthUrl(r: Registration, host: string, scope = "read write follow", redirectUri = defaultRedirect)
        : Promise<string> {
        return Mast.getAuthorizationUrl(r.client_id, r.client_secret, 'https://' + host, scope, redirectUri);
    }

    export function getAccessToken(r: Registration, host: string, code: string): Promise<string> {
        return Mast.getAccessToken(r.client_id, r.client_secret, code, 'https://' + host);
    }

    export function mastodon(conn: Connection, timeout_ms?: number): Mast {
        return new Mast({
            access_token: conn.token,
            timeout_ms: timeout_ms,
            api_url: 'https://' + conn.host + '/api/v1/'
        });
    }
}