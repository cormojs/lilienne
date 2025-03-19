import * as _fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import * as prominence from "prominence";

import { Status } from "./defs";

let fs = prominence(_fs);
let err = (str) => (e) => console.error(str, e);

function isVoid(v: any): v is void {
  return v === void 0;
}

export default class MediaDownloader {
  statuses: Status[] = [];
  constructor(data: string) {
    let obj = JSON.parse(data);
    for (let s of obj) {
      this.statuses.push(new Status(s).actual);
    }
  }

  async download(dirName: string = "files") {
    let dir = path.join(process.cwd(), dirName);
    for (let s of this.statuses) {
      for (let m of s.media_attachments) {
        let url: string = m.remote_url || m.url;
        let result = url.match(/\/([^/?]+)\??[0-9]*$/);
        if (!result || result.length < 2) {
          console.error(`cannot match: ${url}`);
        } else {
          let filename: string = path.join(dir, result[1]);
          if (await fs.exists(filename).catch((_) => _)) {
            console.log(`File already exists: ${filename}`);
          } else {
            console.log(`Saving to ${filename}`);
            let stream = _fs.createWriteStream(filename, {
              flags: "w",
              encoding: "binary",
              autoClose: true,
            });

            let resp = await new Promise<http.IncomingMessage>((r, e) => {
              https.get(url, r);
            }).catch(err("resp error:"));

            let a = await new Promise((resolve, reject) => {
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
              setTimeout(() => resolve(void(0)), 250);
            });
            let v = await sleep.catch((_) => _);
          }
        }
      }
    }
  }
}
