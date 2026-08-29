import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

/** Every user-facing string carries all three locales. */
const localized = z.object({
  hy: z.string().default(''),
  ru: z.string().default(''),
  en: z.string().default(''),
});

const cars = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/cars' }),
  schema: z.object({
    brand: z.string(),
    model: z.string(),
    year: z.number().int().nullable().default(null),
    bodyType: z.enum(['sedan', 'suv', 'hatchback', 'crossover', 'mpv', 'pickup']).nullable().default(null),
    powertrain: z.enum(['electric', 'hybrid', 'phev']),
    rangeKm: z.number().int().positive().nullable().default(null),
    batteryKwh: z.number().positive().nullable().default(null),
    powerHp: z.number().int().positive().nullable().default(null),
    drivetrain: z.enum(['fwd', 'rwd', 'awd']).nullable().default(null),

    /** null means "price on request" — never render a fake number. */
    priceAmd: z.number().int().positive().nullable().default(null),
    /** Dealer's own quoted figure, kept for reference. Not rendered; the
     *  site computes payments from the shared financing settings so one
     *  rate change updates every number on the site. */
    monthlyFromAmd: z.number().int().positive().nullable().default(null),

    status: z.enum(['available', 'on-the-way', 'order', 'sold']).default('available'),
    colors: z.array(z.string()).default([]),
    images: z.array(z.string()).default([]),
    /** Visible credit for the lead image, e.g. "Photo: Name (CC BY-SA 4.0)".
     *  Required by the licence on the Wikimedia Commons stand-in photos;
     *  clear it when Ucar supplies their own photography. */
    imageCredit: z.string().default(''),
    featured: z.boolean().default(false),
    specs: z.array(z.object({ label: localized, value: z.string() })).default([]),
    description: localized.default({ hy: '', ru: '', en: '' }),

    source: z
      .object({ url: z.string().url(), name: z.string(), scrapedAt: z.string() })
      .optional(),

    /** Gate. Nothing scraped reaches production until a human flips this. */
    verified: z.boolean().default(false),
  }),
});

const settings = defineCollection({
  loader: file('./src/content/settings/site.json'),
  schema: z.object({
    id: z.string(),
    phones: z.array(z.string()).min(1),
    whatsapp: z.string(),
    email: z.string().email(),
    address: localized,
    hours: localized,
    mapUrl: z.string().url(),
    /** Optional: paste the `src` from Google Maps → Share → Embed a map, to
     *  pin the showroom exactly. When null the Contact page falls back to a
     *  keyword search embed built from `address`. */
    mapEmbed: z.string().url().or(z.literal('')).nullable().default(null),
    social: z.object({ facebook: z.string().url(), instagram: z.string().url(), linkedin: z.string().url() }),
    financing: z.object({
      ratePercent: z.number().positive(),
      minDownPercent: z.number().int().min(0).max(90),
      maxDownPercent: z.number().int().min(0).max(90),
      defaultDownPercent: z.number().int().min(0).max(90),
      minTermYears: z.number().int().positive(),
      maxTermYears: z.number().int().positive(),
      defaultTermYears: z.number().int().positive(),
      verified: z.boolean(),
    }),
  }),
});

export const collections = { cars, settings };
