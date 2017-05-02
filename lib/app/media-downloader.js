"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const https = require("https");
const defs_1 = require("./defs");
class MediaDownloader {
    constructor(data) {
        this.statuses = [];
        let obj = JSON.parse(data);
        for (let s of obj) {
            this.statuses.push(new defs_1.Status(s).actual);
        }
    }
    download(dirName = "files") {
        let dir = path.join(process.cwd(), dirName);
        for (let s of this.statuses) {
            for (let m of s.media_attachments) {
                let url = m.remote_url || m.url;
                let result = url.match(/\/([^/?]+)\??[0-9]*$/);
                if (!result || result.length < 2) {
                    console.error(`cannot match: ${url}`);
                }
                else {
                    let filename = path.join(dir, result[1]);
                    fs.exists(filename, r => {
                        if (r) {
                            console.log(`File already exists: ${filename}`);
                        }
                        else {
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
exports.default = MediaDownloader;
