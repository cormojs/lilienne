import { createRestAPIClient } from "masto";
import * as fs from "fs";
import { EventEmitter } from "events";
import { Registration, Connection } from "./defs";

export namespace MastUtil {
  export const defaultRedirect = "urn:ietf:wg:oauth:2.0:oob";
  export const apiBase = "/api/v1/";

  export async function createApp(
    host: string,
    name: string,
    scopes = "read write follow",
    redirectUri = defaultRedirect,
  ): Promise<Registration> {
    const client = createRestAPIClient({
      url: "https://" + host,
    });
    
    try {
      const app = await client.v1.apps.create({
        clientName: name,
        scopes,
        redirectUris: redirectUri,
      });
      
      return new Registration({
        client_id: app.clientId,
        client_secret: app.clientSecret,
        id: "0", // Default placeholder since the property structure is different
        redirect_uri: redirectUri
      });
    } catch (error) {
      console.error("Error creating app:", error);
      throw error;
    }
  }

  export async function getAuthUrl(
    r: Registration,
    host: string,
    scope = "read write follow",
    redirectUri = defaultRedirect,
  ): Promise<string> {
    const params = new URLSearchParams({
      client_id: r.client_id,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
    });
    
    return `https://${host}/oauth/authorize?${params.toString()}`;
  }

  export async function getAccessToken(
    r: Registration,
    host: string,
    code: string,
  ): Promise<string> {
    const client = createRestAPIClient({
      url: "https://" + host,
    });
    
    try {
      // Using OAuth token endpoint directly since masto doesn't have a direct method
      const response = await fetch(`https://${host}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: r.client_id,
          client_secret: r.client_secret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: r.redirect_uri
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(`OAuth error: ${data.error}`);
      }
      
      return data.access_token;
    } catch (error) {
      console.error("Error getting access token:", error);
      throw error;
    }
  }

  export function mastodon(conn: Connection, timeout_ms?: number) {
    return createRestAPIClient({
      url: "https://" + conn.host,
      accessToken: conn.token,
      timeout: timeout_ms,
    });
  }
}
