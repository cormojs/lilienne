"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _fs = require("fs");
const path = require("path");
const https = require("https");
const prominence = require("prominence");
const defs_1 = require("./defs");
let fs = prominence(_fs);
let err = (str) => (e) => console.error(str, e);
function isVoid(v) {
    return v === void 0;
}
class MediaDownloader {
    constructor(data) {
        this.statuses = [];
        let obj = JSON.parse(data);
        for (let s of obj) {
            this.statuses.push(new defs_1.Status(s).actual);
        }
    }
    download(dirName = "files") {
        return __awaiter(this, void 0, void 0, function* () {
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
                        if (yield fs.exists(filename).catch((_) => _)) {
                            console.log(`File already exists: ${filename}`);
                        }
                        else {
                            console.log(`Saving to ${filename}`);
                            let stream = _fs.createWriteStream(filename, {
                                flags: "w",
                                encoding: "binary",
                                autoClose: true,
                            });
                            let resp = yield new Promise((r, e) => {
                                https.get(url, r);
                            }).catch(err("resp error:"));
                            let a = yield new Promise((resolve, reject) => {
                                if (resp instanceof Object) {
                                    resp.on("data", (d) => stream.write(d));
                                    resp.on("end", () => {
                                        stream.end();
                                        resolve({});
                                    });
                                    resp.on("error", (e) => {
                                        console.error("resp error:", e);
                                        reject();
                                    });
                                }
                            }).catch((e) => console.error("exit on", e));
                            let sleep = new Promise((resolve, reject) => {
                                setTimeout(() => resolve(), 250);
                            });
                            let v = yield sleep.catch((_) => _);
                        }
                    }
                }
            }
        });
    }
}
exports.default = MediaDownloader;
