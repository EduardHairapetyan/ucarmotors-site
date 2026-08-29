# ucarmotors.am

Multilingual EV catalogue for Ucar Motors (ՅՈՒՔԱՐ ՍՊԸ), Verin Ptghni.
Astro 5, static output. Production is Cloudflare Pages (`ucarmotors.am`);
a GitHub Pages test mirror runs at
`eduardhairapetyan.github.io/ucarmotors-site/`.

Visual direction: white ground with a cyan→blue→violet brand gradient used
sparingly, one blue-violet accent for actions, red kept for errors only. The
history and reasoning live in `REVIEW.md`; the tokens are in
`src/styles/global.css`.

Read **DATA-NOTES.md** before touching anything in `src/content/`.

## Run it

```bash
npm install
npm run dev            # http://localhost:4321
npm run check          # types
npm run build
```

## Deploy

### Production — Cloudflare Pages

```bash
cp .env.example .env && $EDITOR .env
set -a && source .env && set +a

./scripts/deploy.sh --dry-run    # build + audit, upload nothing
./scripts/deploy.sh --preview    # preview branch
./scripts/deploy.sh              # production
./scripts/deploy.sh --domain     # production + attach ucarmotors.am
```

`deploy.sh` refuses a production deploy while `financing.verified` is false in
`src/content/settings/site.json`, because every payment figure on the site is
computed from that rate.

### Test mirror — GitHub Pages

`.github/workflows/deploy.yml` builds and publishes on every push to `main`.
It sets `GITHUB_PAGES=true`, which makes `astro.config.mjs` add
`base: '/ucarmotors-site'` and switch the site URL to the project page. The
Cloudflare build is unaffected (default: no base, `ucarmotors.am`). Enable it
once under **Settings → Pages → Source: GitHub Actions**.

The site has no contact form and no server code — contact is display-only
(phone, WhatsApp, email, address, map).

## Editing content

`./scripts/setup-cms.sh` once, then `/admin`. Sveltia CMS, GitHub-backed —
every edit is a commit, so price history is in the repo and revertable. Give
the sales manager write access to the repo; that is the whole permission model.

## Importing more cars

```bash
npm run scrape           # -> data/cars.draft.json
$EDITOR data/cars.draft.json
npm run promote          # -> src/content/cars/
```

Promotion writes the record. It does not publish the price — `verified` stays
false until a person sets it in `/admin`.

## Layout

```
src/
  content/cars/*.json      one file per car; filename is the URL slug
  content/settings/        phones, address, financing terms
  content.config.ts        zod schemas
  lib/catalog.ts           queries + the price trust gate
  i18n/                    hy | ru | en strings, routing, money, annuity maths
  components/              CarCard, PaymentCalculator, CarSilhouette
  components/views/        the five page bodies, one per route
  pages/                   thin locale routes: / , /ru , /en
  styles/global.css        design tokens
public/admin/              Sveltia CMS
```

## Cost

The `.am` domain. Nothing else — Cloudflare Pages is free at this volume.
