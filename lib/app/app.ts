import { MastUtil } from "./mastutil";
import {
  Registration,
  Account,
  Status,
  Source,
  Stream,
  REST,
  isRESTAPI,
  MastNotification,
  Delete,
  API,
  Connection,
  Query,
} from "./defs";
import AppConfig from "./config";
import * as fs from "fs";
import { createRestAPIClient } from "masto";
import { EventEmitter } from "events";
import * as path from "path";

export class App {
  public static timeout_ms = 60 * 1000;

  public config: AppConfig;
  public fetchedAccounts: { token?: { account: Account; host: string } } = {};

  public registerToHost(host: string): Promise<Registration> {
    return MastUtil.createApp(host, AppConfig.appName).then((reg) => {
      this.config.registrations[host] = reg;
      return reg;
    });
  }

  public constructor(config: AppConfig = new AppConfig()) {
    this.config = config;
  }

  public addAccount(
    host: string,
    code: string,
  ): Promise<{ host: string; token: string } | null> {
    return MastUtil.getAccessToken(
      this.config.registrations[host],
      host,
      code,
    ).then((token) => {
      if (token) {
        let acc = {
          host: host,
          token: token,
        };
        this.config.accounts.push(acc);
        return acc;
      }
      return null;
    });
  }

  public fetchAccount(acc: { token: string; host: string }) {
    console.log(`Fetching ${acc.token} of ${acc.host}`);
    let fetched: { host: string; account: Account } =
      this.fetchedAccounts[acc.token];
    if (!fetched) {
      let m = createRestAPIClient({
        accessToken: acc.token,
        timeout: App.timeout_ms,
        url: "https://" + acc.host,
      });
      return m
        .v1.accounts.verifyCredentials()
        .catch((e) => console.log(`Error while fetching account: ${e}`))
        .then((res) => {
          if (!res) return;
          let account = res as unknown as Account;
          console.log(`Fetched acccount: ${account.username}@${acc.host}`);
          this.fetchedAccounts[acc.token] = {
            host: acc.host,
            account: account,
          };
        });
    }
  }

  public subscribeREST(
    conn: Connection,
    api: API<REST>,
    callback: (err: any, ...ss: Status[]) => void,
  ): Promise<void> {
    let push = async (query: Query): Promise<Query> => {
      try {
        const client = MastUtil.mastodon(conn, App.timeout_ms);
        // Use appropriate endpoint based on API name
        let response;
        const params = query as Record<string, any>;
        
        switch(api.name) {
          case 'timelines/home':
            response = await client.v1.timelines.home.list(params);
            break;
          case 'timelines/public':
            response = await client.v1.timelines.public.list(params);
            break;
          // Add other endpoints as needed
          default:
            throw new Error(`Unsupported API endpoint: ${api.name}`);
        }
        
        if (!response || response.length === 0) {
          return query;
        }
        
        const statuses = response.map(s => new Status(s));
        callback(null, ...statuses);
        
        // Handle pagination if available
        if (response.length > 0) {
          const lastId = response[response.length - 1].id;
          const q = { ...query, max_id: lastId };
          return q;
        } else {
          return query;
        }
      } catch (e) {
        callback(e);
        return query;
      }
    };
    let rec = (query: Query, n: number): Promise<void> => {
      if (n === 0) {
        console.log("Limit exceeded");
        return new Promise<void>((r, _) => {});
      } else {
        return push(query).then<void>((newQuery) => {
          if (newQuery) {
            console.log("Next page");
            setTimeout(() => rec(newQuery, n - 1), 1000);
          } else {
            console.log("Pagination Completed");
          }
        });
      }
    };
    return rec(api.query !== undefined ? api.query : {}, api.form.auto_page);
  }

  public subscribeStream(conn: Connection, api: API<Stream>): EventEmitter {
    // Create an event emitter to mimic the stream interface
    const emitter = new EventEmitter();
    
    // Use WebSocket if available in the future
    // For now, set up polling as a fallback
    const pollInterval = 10000; // 10 seconds
    let lastId: string | null = null;
    
    const poll = async () => {
      try {
        const client = MastUtil.mastodon(conn);
        const params: Record<string, any> = { ...api.query };
        
        if (lastId) {
          params.since_id = lastId;
        }
        
        // Use appropriate endpoint based on API name
        let response;
        switch(api.name) {
          case 'streaming/user':
            response = await client.v1.timelines.home.list(params);
            break;
          case 'streaming/public':
            response = await client.v1.timelines.public.list(params);
            break;
          // Add other endpoints as needed
          default:
            emitter.emit('error', new Error(`Unsupported streaming endpoint: ${api.name}`));
            return;
        }
        
        if (response && response.length > 0) {
          // Update the last ID for the next poll
          lastId = response[0].id;
          
          // Emit events in reverse order (oldest to newest)
          for (let i = response.length - 1; i >= 0; i--) {
            const status = new Status(response[i]);
            emitter.emit('update', status);
          }
        }
      } catch (error) {
        emitter.emit('error', error);
      }
      
      // Schedule the next poll
      setTimeout(poll, pollInterval);
    };
    
    // Start polling
    poll();
    
    return emitter;
  }
}
