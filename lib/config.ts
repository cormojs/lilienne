import { Registration, Source, API, REST, Stream } from './defs';
import { monitored } from './decorators';
import * as fs from 'fs';
import * as path from 'path';


@monitored
export default class AppConfig {
    public static saveDir: string = "saved/";
    public static appName: string = "Lilienne";
    public static configJson: string = "lilienne.json";
    public static apiJson: string = "api.json";

    public registrations: { host?: Registration } = {};
    public accounts: { token: string, host: string }[] = [];
    public sources: Source[] = [];
    public configFile: string;
    public allApi: { name?: API<REST | Stream> } = (() => {
        let data: string = fs.readFileSync(path.join(process.cwd(), AppConfig.apiJson), 'utf8');
        return JSON.parse(data);
    })();


    constructor(name: string = AppConfig.configJson) {
        this.configFile = path.join(process.cwd(), name);
        let content = fs.readFileSync(this.configFile, 'utf8');
        if (content) {
            let config = JSON.parse(content);
            this.registrations = AppConfig.construct(config['registrations'], Registration);
            this.accounts = config['accounts'].map(obj => {
                let o = { token: undefined, host: undefined };
                Object.preventExtensions(o);
                Object.assign(o, obj);
                return o;
            });
            this.sources = config['sources'].map(o => new Source(o));
        }
    }


    public save(filename?: string) {
        let config = {
            registrations: this.registrations,
            accounts: this.accounts,
            sources: this.sources
        };
        fs.writeFileSync(filename || this.configFile, JSON.stringify(config, null, 4));
    }

    private static construct<T, R>(obj: { key?: T }, ctor: new (T) => R)
    : { key?: R } {
        let o: { key?: R } = {};
        for (let key in obj) {
            o[key] = new ctor(obj[key]);
        }
        return o;
    }
}