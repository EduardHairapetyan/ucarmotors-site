#!/usr/bin/env node
/**
 * Move reviewed cars from data/cars.draft.json into src/content/cars/.
 *
 * Promotion writes the record; it does NOT publish the price. `verified`
 * stays false until a person sets it, and the site withholds the price
 * until then. Two separate acts, deliberately.
 *
 *   node scripts/promote.mjs
 *   node scripts/promote.mjs --dry-run
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const DRAFT = 'data/cars.draft.json';
const DEST = 'src/content/cars';
const dryRun = process.argv.includes('--dry-run');

if (!existsSync(DRAFT)) {
  console.error(`No ${DRAFT}. Run: npm run scrape`);
  process.exit(1);
}

const draft = JSON.parse(await readFile(DRAFT, 'utf8'));
await mkdir(DEST, { recursive: true });

const hasText = (d) => d && Object.values(d).some((v) => v && String(v).trim());
let written = 0, skipped = 0;

for (const { _file, ...car } of draft) {
  if (!_file || !car.brand || !car.model) {
    console.log(`skip ${_file ?? '(unnamed)'} — needs brand and model`);
    skipped++;
    continue;
  }

  const file = path.join(DEST, `${_file}.json`);
  let merged = car;

  if (existsSync(file)) {
    const current = JSON.parse(await readFile(file, 'utf8'));
    merged = {
      ...car,
      // Anything a human wrote or confirmed outranks anything scraped.
      description: hasText(current.description) ? current.description : car.description,
      images: current.images?.length ? current.images : car.images,
      imageCredit: current.imageCredit ?? car.imageCredit ?? '',
      specs: current.specs?.length ? current.specs : car.specs,
      featured: current.featured ?? car.featured,
      verified: current.verified ?? false,
      priceAmd: current.verified ? current.priceAmd : car.priceAmd,
    };
  }

  if (!dryRun) await writeFile(file, JSON.stringify(merged, null, 2) + '\n');
  written++;
}

const files = (await readdir(DEST)).length;
console.log(`\n${dryRun ? '[dry run] ' : ''}${written} promoted, ${skipped} skipped — ${files} cars in ${DEST}`);
console.log('Prices stay hidden until verified:true. Review in /admin, then deploy.');
