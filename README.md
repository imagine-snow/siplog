# SipLog · 酒迹

English · [中文](README.zh-CN.md)

SipLog is a local-first drinking journal for recording what you drink, how much is left in a bottle, and your spending over time. The interface follows a simple expense-tracker workflow: choose a drink, confirm its size, record the amount, and save.

This repository preserves **v0.5.3, the first friends-and-family beta**. It contains application source, tests, documentation and a reusable catalog snapshot. Personal drinking records and local test backups are not included.

[Open the web app](https://jiuji-drink-log.imagine-snow.chatgpt.site/) · [Release notes](CHANGELOG.md) · [Data sources](DATA_SOURCES.md)

## Features

- Guided recording: choose a product → confirm alcohol content and package size → record the amount → set your personal share.
- Beer and cider by bottle or can count; spirits and wine by estimated remaining bottle level. Friends' shares reduce bottle stock without adding to your personal intake.
- An electronic cabinet with open bottles first, collapsed history, favorites and optional local cover photos.
- A searchable journal, editable past records, calendar heatmap, drinking estimates and spending summaries.
- Chinese and English interfaces, common Chinese brand aliases, and manual entry when a product is missing.
- JSON backup and restore. Clearing local records, bottles, favorites and photos requires two separate confirmations; exported backup files are kept.
- Installable web-app support and a portable local build. No mandatory mood entries, reviews or daily check-ins.

## Run locally

Use **Node.js 24** and the package-manager version recorded in `package.json` (**pnpm 11.25.0**). The declared minimum Node version is 22.13.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed in the terminal.

For a standalone build that needs no account, backend or API key:

```bash
pnpm build:download
node download/start.cjs
```

Open `http://localhost:4173` and keep the terminal running. On Windows, `download/Start-Windows.cmd` starts the same local server after Node.js is installed. Do not open `index.html` directly.

The contents of `download/` can also be served at the root of an HTTPS website. Subdirectory hosting requires changes to asset, manifest and service-worker paths. This beta is a web app, not an EXE or APK installer.

## Tests

```bash
pnpm test
pnpm typecheck
pnpm build:download
```

The beta was checked with 35 Node tests covering calculations, shared consumption, bottle-level consistency, record editing, backup validation, photos and catalog search. Browser checks covered both clear-data confirmations, cancellation, refresh persistence, backup restoration and stale-tab write protection. See [QA notes](QA.md).

`pnpm build` builds the original Vinext-hosted variant. `.openai/hosting.json` identifies the existing hosted site; do not reuse that identity to publish a different site. For independent hosting, use the standalone build above.

## Databases and references

Two different types of data are used:

| Data | Source / storage | Purpose |
| --- | --- | --- |
| Personal records, cabinet and photos | Browser **IndexedDB** (`jiuji-ledger`) | Local persistence on the user's current browser; no cloud database or automatic sync |
| 30,152 product entries | [Open Food Facts](https://world.openfoodfacts.org/) — [official export](https://huggingface.co/datasets/openfoodfacts/product-database) | Names, brands, categories and alcohol content/package size where available |
| 5,801 beer entries | [Open Beer Database](https://openbeerdb.com/) | Historical beer, brewery, style and ABV references |
| 11 product specifications | Manufacturer references listed in [DATA_SOURCES.md](DATA_SOURCES.md) | A small supplement of factual bottle-label specifications |

The bundled catalog contains **35,964 product entries**, imported on **2026-10-26**. Open Beer Database is a **2011-12-14 historical snapshot**, not a current inventory. Capacity or regional variants may appear as separate entries, and missing alcohol values must be supplied by the user. Chinese aliases are project-maintained, not official database translations.

The combined catalog is distributed under **ODbL-1.0**, with **DbCL-1.0** notices for applicable contents. Source links, source identifiers and provenance are retained in `public/data/drinks.json`; license copies are in `public/data/`. See [full sources and import method](DATA_SOURCES.md) and [notices](NOTICE.md).

## Data and privacy

- Records stay in the current browser's IndexedDB. Clearing browser data can remove them; export a backup before changing browsers, devices or site addresses.
- The live website and local build have separate storage. Transfer records using export and restore.
- Catalog searches and photo processing run locally. There is no application-level behavior analytics or cloud storage for drinking records; the hosting provider may keep its own access logs or traffic metrics.
- Unsaved drafts stay in memory. Changing currency changes the label, not the exchange rate.
- Alcohol and bottle quantities are estimates. This release does not provide medical guidance.

## Calculations

- Bottle depletion = capacity × (previous remaining percentage − current remaining percentage) / 100.
- Personal volume = depletion × personal share.
- Estimated pure alcohol in grams = personal volume in ml × ABV / 100 × 0.789.
- One saved occasion counts once. Friends-only consumption and inventory adjustments do not count as personal drinking occasions.
- Unknown prices are different from zero. Whole-bottle purchase spending and allocated drinking costs are shown separately.
- A blank calendar day means no record, not confirmed abstinence.

## Technologies

- TypeScript and React
- Vite and Vinext
- IndexedDB and browser-local image processing
- Web app manifest and service worker
- Node.js test runner
- Python and DuckDB for optional catalog maintenance

## Project structure

```text
app/                 Pages and responsive styles
components/          Guided recording, cabinet, journal and confirmation dialogs
lib/                 Calculations, validation, storage, search and translations
public/data/         Catalog snapshot, provenance and data licenses
public/brand/        Cup-ring identity and app icons
standalone/          Portable web-app entry point
scripts/             Build helpers and catalog import tools
tests/               Calculation, editing, backup and catalog tests
```

## Possible future features

These ideas are under consideration and are not available in the current beta. Scope and timing may change.

- **Optional health reminders:** Use published research and public-health guidance, with clearly cited sources, to inform gentle reminders when the previous day's logged alcohol intake is high. Reminder criteria would be reviewed before implementation, and users would be able to turn reminders off. These would support awareness, not provide a diagnosis or define a risk-free drinking amount.
- **Optional community features:** A separate space for sharing experiences, moods, occasions and photos. Sharing would be voluntary, with privacy and moderation considered before launch; everyday drink logging would remain simple and independent of the community.

## Credits

**Product of Imagine Snow.**

This project was made with GPT assistance.

## Notes

- This version has no accounts, cross-device sync, community, health recommendations, WeChat mini program or native mobile app.
- Catalog coverage and quality vary. Verify bottle labels and use manual entry when needed.
- Application code has not been assigned an open-source license. Third-party data retains its separate licenses; see [NOTICE.md](NOTICE.md).
- Report bugs in [Issues](https://github.com/imagine-snow/siplog/issues), including your browser/device, steps and expected behavior. Do not attach private drinking backups.
- Future changes can be committed to this repository; the `v0.5.3` tag preserves this first beta.
