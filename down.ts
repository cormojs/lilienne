import MediaDownloader from './lib/app/media-downloader';
import * as fs from 'fs';
import * as path from 'path';

let json = path.join(process.cwd(), "saved/201752-205415.json");

fs.readFile(json, 'utf8', (err, data) => {
    if (err) {
        console.error(err);
    } else {
        new MediaDownloader(data).download()
    }
});
