// Leonida Trophy Compendium — gta6-trophy-guide-01 entry (Node 22, stdlib only).
// The guide is this directory's app/ folder: plain static files, opened at
// app/index.html (ES modules + CSS, no build step), fully offline — it loads
// nothing over the network. The trophy list and the guides live in
// app/data/trophies.json; the source list in app/data/sources.json.
// This program hands the entry in: it copies app/ and screenshots/ from beside
// this file to /output and writes /output/dossier.json — the summary the judge
// reads (screenshots, first-load files and bytes, and the source) — with the
// vendored make.fun library. vendor/makefun-frontend.ts is the kit's copy,
// unchanged: the scorer requires dossier.json byte for byte what its own copy
// writes.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Refuse a weak build instead of handing it in quietly: the judge reads the
// entry through its screenshots, so fewer than 3 of them is not an entry.
const shots = existsSync(join(here, 'screenshots'))
  ? readdirSync(join(here, 'screenshots')).filter((f) => !f.startsWith('.'))
  : [];
if (shots.length < 3) throw new Error(`need at least 3 screenshots in screenshots/, found ${shots.length}`);

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files and directories in app/
// or 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
