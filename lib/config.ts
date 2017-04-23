import { Registration, Source } from './defs';
import { monitored } from './decorators';
import * as fs from 'fs';


@monitored
export class AppConfig {
    public registrations: { host?: Registration } = {};
    public accounts: { token: string, host: string }[] = [];
    public sources: Source[] = [];


    constructor(filename: string) {
        let content = fs.readFileSync(filename, 'utf8');
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

    public save(filename: string) {
        let config = {
            registrations: this.registrations,
            accounts: this.accounts,
            sources: this.sources
        };
        fs.writeFileSync(filename, JSON.stringify(config));
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