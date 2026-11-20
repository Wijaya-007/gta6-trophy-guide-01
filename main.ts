// Leonida Trophy Compendium — GTA VI trophy guide & tracker (Node 22, stdlib only).
// The guide is this directory's app/ folder: plain static files a browser opens at
// app/index.html (ES module, CSS, no build step), fully offline. This program hands
// it in: it copies app/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json with the vendored make.fun library. Leave vendor/ alone:
// the scorer requires dossier.json to be byte for byte what its own copy writes.
//
// Serve the guide locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const shotsDir = join(here, 'screenshots');

function countScreenshots() {
  if (!existsSync(shotsDir)) return 0;
  return readdirSync(shotsDir).filter((name) => {
    if (name.startsWith('.')) return false;
    const full = join(shotsDir, name);
    if (!statSync(full).isFile()) return false;
    return /\.(png|jpe?g)$/i.test(name);
  }).length;
}

const shotCount = countScreenshots();
if (shotCount < 3) {
  throw new Error(`trophy guide needs at least 3 screenshots, found ${shotCount} in screenshots/`);
}

// Fail fast on a broken data file instead of handing in a bad dossier: the guide
// must name all 55 official trophies, each with a non-blank guide of its own.
const trophyFile = join(here, 'app', 'data', 'trophies.json');
const trophyData = JSON.parse(readFileSync(trophyFile, 'utf8'));
const trophyList = Array.isArray(trophyData) ? trophyData : trophyData.trophies;
if (!Array.isArray(trophyList) || trophyList.length !== 55) {
  throw new Error(`trophies.json must hold 55 trophies, found ${Array.isArray(trophyList) ? trophyList.length : 'none'}`);
}
for (const t of trophyList) {
  if (typeof t.name !== 'string' || !t.name.trim() || typeof t.guide !== 'string' || !t.guide.trim()) {
    throw new Error(`trophies.json: every trophy needs a name and a non-blank guide (bad entry: ${JSON.stringify(t.name)})`);
  }
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes;
// the others refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files and directories in app/ or 48 MiB of app files).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
