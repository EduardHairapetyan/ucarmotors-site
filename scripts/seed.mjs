#!/usr/bin/env node
/**
 * Writes the seed catalogue into src/content/cars/.
 *
 * Provenance rules applied here — read DATA-NOTES.md before changing anything:
 *   verified: true   price came from a retrieved source (mycar.am dealer 39)
 *   verified: false  model confirmed in Ucar's own marketing, price unconfirmed
 *   rangeKm: null    NOT guessed. Only filled where a source stated it plainly.
 */
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const MYCAR = { url: 'https://mycar.am/dealers/39', name: 'mycar.am', scrapedAt: '2026-08-29' };
const LINKEDIN = { url: 'https://am.linkedin.com/company/ucar-motors', name: 'linkedin', scrapedAt: '2026-08-29' };

const empty = { hy: '', ru: '', en: '' };

const cars = [
  {
    file: 'deepal-s07-2025',
    brand: 'Deepal', model: 'S07', year: 2025,
    bodyType: 'suv', powertrain: 'electric',
    priceAmd: 10_000_000, monthlyFromAmd: 170_500,
    status: 'available', featured: true, verified: true, source: MYCAR,
    description: {
      hy: 'Միջին չափի էլեկտրական քրոսովեր՝ ամենամատչելի մուտքի կետը մեր տեսականում։',
      ru: 'Среднеразмерный электрический кроссовер — самая доступная точка входа в нашем модельном ряду.',
      en: 'A mid-size electric crossover and the most affordable entry point in our range.',
    },
  },
  {
    file: 'mazda-ez60-200-max-2025',
    brand: 'Mazda', model: 'EZ60 200 Max', year: 2025,
    bodyType: 'suv', powertrain: 'hybrid',
    priceAmd: 11_700_000, monthlyFromAmd: 199_500,
    status: 'available', featured: false, verified: true, source: MYCAR,
  },
  {
    file: 'mazda-ez60-600-max-2025',
    brand: 'Mazda', model: 'EZ60 600 Max', year: 2025,
    bodyType: 'suv', powertrain: 'electric',
    priceAmd: 11_800_000, monthlyFromAmd: 201_500,
    status: 'available', featured: true, verified: true, source: MYCAR,
  },
  {
    file: 'byd-yuan-plus',
    brand: 'BYD', model: 'Yuan Plus', year: null,
    bodyType: 'crossover', powertrain: 'electric',
    rangeKm: 500, // stated by Ucar's own LinkedIn post: "500 km / 310 miles"
    priceAmd: null, status: 'available', featured: true, verified: false, source: LINKEDIN,
    description: {
      hy: 'BYD-ի Blade մարտկոցով՝ 500 կմ մեկ լիցքավորմամբ։',
      ru: 'С батареей BYD Blade — 500 км на одном заряде.',
      en: "With BYD's Blade battery — 500 km on a single charge.",
    },
  },
  {
    file: 'zeekr-001',
    brand: 'Zeekr', model: '001', year: null,
    bodyType: 'crossover', powertrain: 'electric',
    priceAmd: null, status: 'order', featured: false, verified: false, source: LINKEDIN,
  },
  {
    file: 'avatr-12',
    brand: 'Avatr', model: '12', year: null,
    bodyType: 'sedan', powertrain: 'electric',
    priceAmd: null, status: 'order', featured: false, verified: false, source: LINKEDIN,
  },
  {
    file: 'byd-leopard-4wd-ultra',
    brand: 'BYD', model: 'Leopard 4WD Ultra', year: 2025,
    bodyType: 'suv', powertrain: 'phev', drivetrain: 'awd',
    priceAmd: null, status: 'available', featured: false, verified: false, source: MYCAR,
  },
  {
    file: 'dongfeng-nano-box',
    brand: 'Dongfeng', model: 'Nano Box', year: null,
    bodyType: 'hatchback', powertrain: 'electric',
    priceAmd: null, status: 'order', featured: false, verified: false, source: LINKEDIN,
    description: {
      hy: 'Կոմպակտ քաղաքային էլեկտրամոբիլ։',
      ru: 'Компактный городской электромобиль.',
      en: 'A compact city EV.',
    },
  },
  {
    file: 'toyota-bz4x',
    brand: 'Toyota', model: 'bZ4X', year: null,
    bodyType: 'crossover', powertrain: 'electric',
    priceAmd: null, status: 'order', featured: false, verified: false, source: LINKEDIN,
  },
  {
    file: 'volkswagen-id4',
    brand: 'Volkswagen', model: 'ID.4', year: null,
    bodyType: 'crossover', powertrain: 'electric',
    priceAmd: null, status: 'order', featured: false, verified: false, source: LINKEDIN,
  },
  {
    file: 'volkswagen-id6-crozz',
    brand: 'Volkswagen', model: 'ID.6 Crozz', year: null,
    bodyType: 'suv', powertrain: 'electric',
    priceAmd: null, status: 'order', featured: false, verified: false, source: LINKEDIN,
  },
  {
    file: 'honda-enp1',
    brand: 'Honda', model: 'e:NP1', year: null,
    bodyType: 'crossover', powertrain: 'electric',
    priceAmd: null, status: 'order', featured: false, verified: false, source: LINKEDIN,
  },
];

await mkdir('src/content/cars', { recursive: true });

for (const { file, description, ...rest } of cars) {
  // Photography and its credit are added by hand after seeding — never
  // clobber them on a re-seed.
  const dest = `src/content/cars/${file}.json`;
  const prev = existsSync(dest) ? JSON.parse(await readFile(dest, 'utf8')) : {};

  const record = {
    brand: rest.brand,
    model: rest.model,
    year: rest.year ?? null,
    bodyType: rest.bodyType ?? null,
    powertrain: rest.powertrain,
    rangeKm: rest.rangeKm ?? null,
    batteryKwh: rest.batteryKwh ?? null,
    powerHp: rest.powerHp ?? null,
    drivetrain: rest.drivetrain ?? null,
    priceAmd: rest.priceAmd ?? null,
    monthlyFromAmd: rest.monthlyFromAmd ?? null,
    status: rest.status,
    colors: [],
    images: prev.images?.length ? prev.images : [],
    imageCredit: prev.imageCredit ?? '',
    featured: rest.featured,
    specs: [],
    description: description ?? empty,
    source: rest.source,
    verified: rest.verified,
  };
  await writeFile(`src/content/cars/${file}.json`, JSON.stringify(record, null, 2) + '\n');
}

const v = cars.filter((c) => c.verified).length;
console.log(`${cars.length} cars written — ${v} verified, ${cars.length - v} awaiting confirmation`);
