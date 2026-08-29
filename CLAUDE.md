# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Multilingual (hy/ru/en) static EV catalogue for Ucar Motors, built with Astro 5,
deployed to Cloudflare Pages (production) with a GitHub Pages test mirror.
Fully static output — no Pages Functions.

## Commands

```bash
npm run dev          # dev server, http://localhost:4321
npm run check        # astro check — type check; deploy.sh gates on 0 errors
npm run build        # -> dist/
npm run preview      # serve the built dist/

npm run scrape       # scrape sources -> data/cars.draft.json (never writes src/)
npm run promote      # data/cars.draft.json -> src/content/cars/*.json
npm run seed         # (re)write the seed catalogue into src/content/cars/

npm run deploy:dry   # build + content audit + smoke tests, upload nothing
npm run deploy:preview
npm run deploy       # production (blocked while financing is unverified — see below)
npm run cms:setup    # one-time Sveltia CMS setup, then edit at /admin
```

There is no test runner. Verification is: `npm run check`, the smoke tests
inside `scripts/deploy.sh`, and manual review of rendered pages.

## The two verification gates (read `DATA-NOTES.md` first)

Every fact in `src/content/` is sourced or explicitly marked unconfirmed. Two
independent flags carry the risk:

- **`verified` on a car** (`src/content/cars/*.json`) — gates whether that car's
  *price* is published. False → site shows "price on request" and emits no
  schema.org `Offer`. Enforced in code by `priceOf()` in `src/lib/catalog.ts`;
  never bypass it or render `priceAmd` directly.
- **`financing.verified`** (`src/content/settings/site.json`) — gates production
  deploys entirely. `scripts/deploy.sh` aborts a non-preview deploy while it is
  false, because every payment figure on the site is computed from that rate.

`priceAmd: null` means "price on request" — never substitute a placeholder
number. `rangeKm`/`batteryKwh`/`powerHp` are `null` unless a source stated the
value plainly; a null field simply does not render (e.g. the range bar).

Each car has a stand-in lead photo in `public/images/cars/<slug>.jpg` from
Wikimedia Commons, with a licence-required visible credit in `imageCredit`
(rendered on the car page). Provenance + identity-confidence table is in
`DATA-NOTES.md`; clear `imageCredit` when Ucar supplies its own photography.
`seed.mjs` / `promote.mjs` both preserve `images` + `imageCredit` on re-run.

## Data flow for adding cars

`scrape.mjs` → `data/cars.draft.json` (human edits this) → `promote.mjs` →
`src/content/cars/`. Promotion writes the record but leaves `verified: false`;
publishing the price is a separate human act in `/admin`. `promote.mjs` merges:
anything a human wrote (description, images, specs, featured, verified) outranks
re-scraped values.

Content is edited in production via Sveltia CMS (`public/admin/`), GitHub-backed
— every edit is a commit, so price history lives in git.

## Architecture

- **Routing / i18n.** `defaultLocale: 'hy'` with `prefixDefaultLocale: false`,
  so `/` is Armenian, `/ru/...` and `/en/...` are prefixed. Every route exists
  three times under `src/pages/` (`index.astro`, `ru/index.astro`,
  `en/index.astro`) as a thin file that sets `lang` and renders a shared body
  from `src/components/views/` (`Home`, `Cars`, `CarDetail`, `Financing`,
  `Contact`). Add a page → add all three route files.
- **`src/i18n/`.** `ui.ts` holds every UI string keyed by locale (all three
  locales required per key). `utils.ts` has `useTranslations`, `localePath`,
  `stripLocale`, `pick` (locale fallback hy→en), `formatAmd`, `slugOf`, and
  `monthlyPayment` (standard annuity formula — the single source of truth for
  every payment figure). Content strings use the `localized` zod object
  (`{ hy, ru, en }`) from `content.config.ts`.
- **`src/lib/catalog.ts`.** All catalogue queries. `getCars` filters out `sold`
  and sorts priced-cheapest-first. `priceOf` is the price trust gate. `maxRange`
  drives the fleet-relative range bar.
- **`src/layouts/Base.astro`.** Builds `<head>`, canonical + hreflang alternates,
  and the schema.org `@graph` (AutoDealer always; pages pass extra `schema`).
- **No contact forms.** The site has no lead/enquiry form and no `/api/lead`
  function — the client asked for every "request a call / test drive / info"
  path removed. Contact is display-only: phone, WhatsApp, email, address, map,
  social (`src/components/views/Contact.astro`, `Footer`, `MobileActionBar`).
  Do not reintroduce a form.
- **Styling.** Tailwind 4 via `@tailwindcss/vite`. Design tokens live in
  `src/styles/global.css`. The visual rules and their rationale are in
  `REVIEW.md` — notably: red is an actions-only colour (buttons, active nav,
  the rule above the payment); the payment figure is carried by scale, plain
  white, never coloured.

## Deploy environment

**Production is Cloudflare Pages** (`ucarmotors.am`). `.env` (from
`.env.example`) holds Cloudflare deploy creds and optional Facebook scrape
tokens. Load with `set -a && source .env && set +a`. `deploy.sh` runs `npm ci`,
a content audit, `npm run check`, `npm run build`, then smoke tests (JSON-LD
present, hreflang present, locale routes + sitemap exist) before uploading via
`wrangler pages deploy`.

**GitHub Pages is a throwaway test mirror** at
`eduardhairapetyan.github.io/ucarmotors-site/`, published by
`.github/workflows/deploy.yml` on every push to `main`. It is not production.

`astro.config.mjs` branches on `process.env.GITHUB_PAGES`: the default (CF)
build has no `base` and `site: ucarmotors.am`; the Actions build sets
`GITHUB_PAGES=true`, which adds `base: '/ucarmotors-site'` and switches the
site URL. Because Astro does **not** rewrite hand-written `href`/`src`, every
internal link goes through `localePath()` and every root-absolute asset path
through `asset()` in `src/i18n/utils.ts` (both read `import.meta.env.BASE_URL`);
`Base.astro` builds canonical / hreflang / schema `@id`s the same way. When
adding a link or an image, use those helpers — never a bare `/path`.
