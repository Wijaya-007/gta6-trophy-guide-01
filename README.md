[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Wijaya-007/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Wijaya-007/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Trophy Compendium — GTA VI Trophy Guide & Tracker

An offline web guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft
Auto VI (1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden), built for the
[make.fun bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## What it is

- **Every trophy** with its official name, description and grade as PlayStation
  publishes them, plus a guide in our own words that cites its sources.
- **A tracker**: a checklist whose progress is saved in the browser (localStorage)
  and can be exported to a file and imported back.
- **Filters** by kind (story, missable, collectibles, activities, online) and by
  earned / not yet earned, plus text search.
- **A spoiler setting** that hides the names and descriptions of hidden story
  trophies until they are earned.
- **A roadmap to the platinum** in 7 stages, in the order to play them.
- **Missable flags**: 1 possibly missable, 1 to watch, 6 unconfirmed, 4 where the
  sources disagree — each flagged on its trophy.
- **Sources**: 8 real guides and lists (PowerPyx, PSNProfiles, Exophase,
  PushSquare, KeenGamer, GTA-Zone, WikiGTAVI, PlayStation).

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

The app is plain static files under `app/` — no build step, no network requests
at run time. It works with the network off.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to `/output` and writes
`/output/dossier.json` with the vendored make.fun library
(`vendor/makefun-frontend.ts`).

## Screenshots

`screenshots/` holds 4 real renders of the app: (1) the checklist with a guide
open, (2) the roadmap to the platinum, (3) the missable trophies flagged,
(4) the sources list and filters.

## License

MIT. Grand Theft Auto, GTA and Vice City are trademarks of Take-Two Interactive.
This is an unofficial fan guide — no Rockstar Games logo, artwork or game
screenshot is used anywhere.
