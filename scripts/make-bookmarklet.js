import { readFileSync, writeFileSync } from 'node:fs';
const code = readFileSync('tsubo-bookmarklet.min.js', 'utf8').trim();
writeFileSync('tsubo-bookmarklet.bookmarklet.txt', `javascript:${code}`);
