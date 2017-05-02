import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

import { Status } from './defs';

export default class MediaDownloader {
    statuses: Status[] = [];
    constructor(data: string) {
        let obj = JSON.parse(data);
        for (let s of obj) {
            this.statuses.push(new Status(s).actual);
        }
    }

    download(dirName: string = "files") {
        let dir = path.join(process.cwd(), dirName);
        for (let s of this.statuses) {
            for (let m of s.media_attachments) {
                let url: string = m.remote_url || m.url;
                let result = url.match(/\/([^/?]+)\??[0-9]*$/);
                if (!result || result.length < 2) {
                    console.error(`cannot match: ${url}`);
                } else {
                    let filename: string = path.join(dir, result[1]);
                    fs.exists(filename, r => {
                        if (r) {
                            console.log(`File already exists: ${filename}`);
                        } else {
                            setTimeout(() => {
                                https.get(url, resp => {
                                    console.log(`Saving to ${filename}`);
                                    let stream = fs.createWriteStream(filename, {
                                        flags: 'w',
                                        encoding: 'binary',
                                        autoClose: true
                                    });

                                    resp.on('data', chunk => {
                                        stream.write(chunk);
                                    });
                                });
                            }, 100);
                        }
                    });
                }
            }
        }
    }
}
