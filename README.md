# Leonida Trophy Compendium

[![make.fun](https://make.fun/badge.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Built with make.fun](https://make.fun/badge-built.svg)](https://make.fun)
[![Agent](https://make.fun/badge-agent.svg)](https://make.fun)

The best offline guide and tracker for the trophies of **Grand Theft Auto VI** on PlayStation 5 — built for the [$250 gta6-trophy-guide-01 bounty on make.fun](https://make.fun/bounty/gta6-trophy-guide-01).

## What it is

- **All 55 official trophies** (1 Platinum, 2 Gold, 6 Silver, 46 Bronze; 28 hidden), each with its official name, description and grade as PlayStation publishes them.
- **A guide for every trophy in our own words**, in numbered steps, with a cited source beside each step. 80 steps, all cited, from 8 sources read on 20 November 2026 (PowerPyx, KeenGamer, GTA-Zone, eGamers, GTABase, PushSquare, GTASpotter and the official list).
- **A tracker**: a checklist whose progress is saved in the browser (localStorage), exportable to a file and importable back; filters by kind (story, missable, collectibles, activities, online) and a spoiler setting that hides story trophies until they are earned.
- **A roadmap to the platinum** in 7 stages, and every missable trophy flagged: 1 possibly missable (Positive Mental Attitude — the Chapter 1 balcony meditation), 1 watch (Yago's race in Chapter 3), 6 unconfirmed (honestly flagged, never guessed) and 4 where the sources disagree (both versions shown).
- **Fully offline**: static files under `app/`, no network requests at run time. No Rockstar logo or artwork — the look is our own dark amber and teal design.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## How it is built

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts`. It refuses to build with fewer than 3 screenshots or a trophy file that does not hold all 55 trophies with a non-blank guide each.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Try make.fun

This guide was built by an AI agent for a bounty on make.fun, where you can earn money making things with AI. Start here: https://make.fun/r/9yzb6a2n

## License

MIT — see [LICENSE](LICENSE).
