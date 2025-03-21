import {
  Registration,
  Source,
  API,
  REST,
  Stream,
  Status,
  Connection,
} from "./defs";
import { Monitored } from "../decorators";
import * as fs from "fs";
import * as path from "path";
import defaultFilters from "./filters";

@Monitored
export default class AppConfig {
  public static saveDir: string = "saved/";
  public static appName: string = "Lilienne";
  public static configJson: string = "lilienne.json";
  public static apiJson: string = "api.json";
  public static filters: { [key: string]: (s: Status) => boolean } = {
    "has media": defaultFilters["hasMedia"][1]({}),
    none: (_) => true,
  };

  public registrations: { host?: Registration } = {};
  public accounts: Connection[] = [];
  public sources: Source[] = [];
  public configFile: string;
  public allApi: { name?: API<REST | Stream> } = (() => {
    let data: string = fs.readFileSync(
      path.join(process.cwd(), AppConfig.apiJson),
      "utf8",
    );
    return JSON.parse(data);
  })();

  constructor(name: string = AppConfig.configJson) {
    this.configFile = path.join(process.cwd(), name);
    let content = fs.readFileSync(this.configFile, "utf8");
    if (content) {
      let config = JSON.parse(content);
      this.registrations = AppConfig.construct(
        config["registrations"],
        Registration,
      );
      this.accounts = config["accounts"].map((obj) => {
        let o = { token: undefined, host: undefined };
        Object.preventExtensions(o);
        Object.assign(o, obj);
        return o;
      });
      this.sources = config["sources"].map((o) => new Source(o));
    }
  }

  public save(filename?: string) {
    let config = {
      registrations: this.registrations,
      accounts: this.accounts,
      sources: this.sources,
    };
    fs.writeFileSync(
      filename || this.configFile,
      JSON.stringify(config, null, 4),
    );
  }

  private static construct<T, R>(
    obj: { [key: string]: T },
    ctor: new (t: T) => R,
  ): { [key: string]: R } {
    let o: { [key: string]: R } = {};
    for (let key in obj) {
      o[key] = new ctor(obj[key]);
    }
    return o;
  }
}
