#!/usr/bin/env node
/**
 * Ucar Motors catalogue scraper.
 *
 *   node scripts/scrape.mjs                 # all adapters, static fetch
 *   node scripts/scrape.mjs --only=mycar    # one adapter
 *   node scripts/scrape.mjs --rendered      # use Playwright for JS-heavy pages
 *
 * Writes data/raw/<source>.json and data/cars.draft.json.
 * Never touches src/content/ — promotion to the live catalogue is a human step.
 *
 * deps: npm i -D cheerio   (and optionally: npm i -D playwright)
 */

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as cheerio from 'cheerio';

const UA =
  'UcarMotorsSiteBot/1.0 (catalogue import for ucarmotors.am; contact: info@ucarmotors.am)';
const DELAY_MS = 2000;
const OUT_DIR = 'data';

const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith('--only='))?.split('=')[1];
const useRendered = args.includes('--rendered');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ fetching */

async function fetchStatic(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'hy,en;q=0.8,ru;q=0.6' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

let browser = null;
async function fetchRendered(url) {
  if (!browser) {
    const { chromium } = await import('playwright');
    browser = await chromium.launch();
  }
  const page = await browser.newPage({ userAgent: UA });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  const html = await page.content();
  await page.close();
  return html;
}

const grab = (url) => (useRendered ? fetchRendered(url) : fetchStatic(url));

/* ------------------------------------------------------------------- helpers */

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

/** "11 700 000 ֏" / "11,700,000" / "$26,800" -> 11700000 */
function parseMoney(text) {
  if (!text) return null;
  const digits = String(text).replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
}

function parseYear(text) {
  const m = String(text ?? '').match(/\b(19|20)\d{2}\b/);
  return m ? Number(m[0]) : null;
}

/** Split "Mazda EZ60 200 Max" into brand + model, using a known-brand list. */
const KNOWN_BRANDS = [
  'BYD', 'Zeekr', 'Avatr', 'Deepal', 'Mazda', 'Dongfeng', 'Toyota',
  'Volkswagen', 'Honda', 'Changan', 'Li', 'Aion', 'Chery', 'Hongqi',
  'Geely', 'Nio', 'Xpeng', 'Tesla', 'Voyah', 'Jetour', 'Leapmotor',
];

function splitTitle(title) {
  const t = String(title ?? '').trim().replace(/\s+/g, ' ');
  const brand = KNOWN_BRANDS.find((b) => t.toLowerCase().startsWith(b.toLowerCase()));
  if (!brand) return { brand: null, model: t || null };
  return { brand, model: t.slice(brand.length).trim() || null };
}

function normalise(partial, source) {
  const { brand, model } = partial.brand
    ? { brand: partial.brand, model: partial.model }
    : splitTitle(partial.title);

  const year = partial.year ?? parseYear(partial.title);
  const slug = slugify([brand, model, year].filter(Boolean).join(' '));

  return {
    _file: slug,
    brand,
    model,
    year,
    bodyType: partial.bodyType ?? null,
    powertrain: partial.powertrain ?? null,
    rangeKm: partial.rangeKm ?? null,
    batteryKwh: partial.batteryKwh ?? null,
    powerHp: partial.powerHp ?? null,
    drivetrain: partial.drivetrain ?? null,
    priceAmd: partial.priceAmd ?? null,
    monthlyFromAmd: partial.monthlyFromAmd ?? null,
    status: partial.status ?? 'available',
    colors: partial.colors ?? [],
    images: partial.images ?? [],
    featured: false,
    specs: partial.specs ?? [],
    description: { hy: '', ru: '', en: '' },
    source: { url: source.url, name: source.name, scrapedAt: new Date().toISOString().slice(0, 10) },
    verified: false,
  };
}

/* ------------------------------------------------------------------ adapters */

/**
 * ADAPTER MAINTENANCE NOTE
 * Selectors below are best-effort and WILL rot. When an adapter returns 0 rows,
 * run with --rendered, dump the HTML (`--dump`), and fix the selectors. Each
 * adapter is isolated so one broken source never kills the run.
 */

const adapters = [
  {
    name: 'mycar',
    url: 'https://mycar.am/dealers/39',
    parse(html, source) {
      const $ = cheerio.load(html);
      const out = [];

      // mycar renders each listing as a card; try a few plausible containers.
      const cards = $('[class*="card"], [class*="product"], [class*="item"]').filter(
        (_, el) => $(el).text().includes('֏')
      );

      cards.each((_, el) => {
        const $el = $(el);
        const text = $el.text().replace(/\s+/g, ' ').trim();

        const title =
          $el.find('h2, h3, h4, [class*="title"], [class*="name"]').first().text().trim() ||
          null;
        if (!title) return;

        // Two money figures usually appear: total price then monthly.
        const money = [...text.matchAll(/([\d\s,]{4,})\s*֏/g)].map((m) => parseMoney(m[1]));
        const priceAmd = money.find((v) => v && v > 1_000_000) ?? null;
        const monthlyFromAmd = money.find((v) => v && v < 1_000_000) ?? null;

        const rangeMatch = text.match(/(\d{2,4})\s*(?:km|կմ|км)/i);
        const powertrain = /Էլեկտ|электр|electric/i.test(text)
          ? 'electric'
          : /Հիբրիդ|гибрид|hybrid/i.test(text)
            ? 'hybrid'
            : null;

        const images = $el
          .find('img')
          .map((__, img) => $(img).attr('src') || $(img).attr('data-src'))
          .get()
          .filter(Boolean)
          .map((src) => new URL(src, source.url).href);

        out.push(
          normalise(
            {
              title,
              year: parseYear(text),
              priceAmd,
              monthlyFromAmd,
              powertrain,
              rangeKm: rangeMatch ? Number(rangeMatch[1]) : null,
              images,
            },
            source
          )
        );
      });

      return out;
    },
  },

  {
    // Facebook: public Graph API only. Requires a page access token from the client.
    // Set FB_PAGE_TOKEN and FB_PAGE_ID to enable; otherwise this adapter skips.
    name: 'facebook',
    url: 'https://graph.facebook.com/v20.0',
    async fetch() {
      const token = process.env.FB_PAGE_TOKEN;
      const pageId = process.env.FB_PAGE_ID;
      if (!token || !pageId) return null; // skip
      const url = `${this.url}/${pageId}/posts?fields=message,full_picture,permalink_url,created_time&limit=100&access_token=${token}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Graph API ${res.status}`);
      return JSON.stringify(await res.json());
    },
    parse(json, source) {
      if (!json) return [];
      const data = JSON.parse(json).data ?? [];
      // Posts are marketing copy, not structured listings. Emit them as
      // "candidates" for a human to turn into cars, plus a tone-of-voice corpus.
      return data
        .filter((p) => p.message)
        .map((p) => ({
          _kind: 'post',
          text: p.message,
          image: p.full_picture ?? null,
          url: p.permalink_url,
          date: p.created_time,
          source: { name: source.name },
        }));
    },
  },
];

/* ----------------------------------------------------------------- merge step */

function mergeCars(lists) {
  const byKey = new Map();
  for (const car of lists.flat()) {
    if (car._kind) continue; // posts, not cars
    const key = [car.brand, car.model, car.year].join('|').toLowerCase();
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, car);
      continue;
    }
    // Prefer non-null values; union images.
    for (const [k, v] of Object.entries(car)) {
      if (k === 'images') existing.images = [...new Set([...existing.images, ...v])];
      else if (existing[k] == null && v != null) existing[k] = v;
    }
  }
  return [...byKey.values()].sort((a, b) =>
    `${a.brand}${a.model}`.localeCompare(`${b.brand}${b.model}`)
  );
}

/* ------------------------------------------------------------------- runner */

async function main() {
  await mkdir(`${OUT_DIR}/raw`, { recursive: true });

  const selected = only ? adapters.filter((a) => a.name === only) : adapters;
  if (selected.length === 0) {
    console.error(`No adapter named "${only}". Available: ${adapters.map((a) => a.name).join(', ')}`);
    process.exit(1);
  }

  const results = [];
  const posts = [];

  for (const adapter of selected) {
    process.stdout.write(`→ ${adapter.name} … `);
    try {
      const raw = adapter.fetch ? await adapter.fetch() : await grab(adapter.url);
      if (raw === null) {
        console.log('skipped (no credentials)');
        continue;
      }
      const parsed = adapter.parse(raw, adapter);
      const cars = parsed.filter((p) => !p._kind);
      const ps = parsed.filter((p) => p._kind === 'post');

      results.push(cars);
      posts.push(...ps);

      await writeFile(
        `${OUT_DIR}/raw/${adapter.name}.json`,
        JSON.stringify(parsed, null, 2)
      );
      console.log(`${cars.length} cars, ${ps.length} posts`);
    } catch (err) {
      console.log(`FAILED — ${err.message}`);
    }
    await sleep(DELAY_MS);
  }

  const merged = mergeCars(results);
  await writeFile(`${OUT_DIR}/cars.draft.json`, JSON.stringify(merged, null, 2));
  if (posts.length) {
    await writeFile(`${OUT_DIR}/raw/posts.json`, JSON.stringify(posts, null, 2));
  }

  if (browser) await browser.close();

  console.log(`\n${merged.length} unique cars → ${OUT_DIR}/cars.draft.json`);
  const incomplete = merged.filter((c) => !c.priceAmd || !c.brand);
  if (incomplete.length) {
    console.log(`${incomplete.length} need manual completion (missing brand or price):`);
    for (const c of incomplete) console.log(`   - ${c._file || '(unnamed)'}`);
  }
  console.log('\nEvery record is verified:false. Review, fix, then: npm run promote');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
