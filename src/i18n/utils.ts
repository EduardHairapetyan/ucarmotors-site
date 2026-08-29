import { ui, defaultLang, locales, type Lang, type UIKey } from './ui';

/** Deploy base path, no trailing slash. '' at the apex, '/ucarmotors-site' on
 *  GitHub Pages. Astro does not rewrite hand-written hrefs, so every internal
 *  link and asset URL is routed through `localePath` / `asset` below. */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Derive the active locale from the URL path. `/` is hy, `/ru/...` is ru. */
export function getLangFromUrl(url: URL): Lang {
  let p = url.pathname;
  if (BASE && (p === BASE || p.startsWith(BASE + '/'))) p = p.slice(BASE.length);
  const seg = p.split('/').filter(Boolean)[0];
  return (locales as readonly string[]).includes(seg ?? '') ? (seg as Lang) : defaultLang;
}

export function useTranslations(lang: Lang) {
  return (key: UIKey): string => ui[lang][key] ?? ui[defaultLang][key];
}

/** Build a locale-correct, base-prefixed href. hy has no locale prefix. */
export function localePath(lang: Lang, path = '/'): string {
  const clean = '/' + path.replace(/^\/+|\/+$/g, '');
  const loc = lang === defaultLang ? '' : `/${lang}`;
  const rel = clean === '/' ? loc || '/' : `${loc}${clean}`;
  return BASE + rel;
}

/** Prefix a site-absolute asset path (e.g. `/images/cars/x.jpg`) with the
 *  deploy base. Content records store paths from the site root. */
export function asset(path: string): string {
  return BASE + '/' + path.replace(/^\/+/, '');
}

/**
 * Href inside the design-preview tree: `/preview/<design>/<locale>/<path>`.
 *
 * The preview tree deliberately does *not* follow the production URL shape —
 * hy is prefixed here like every other locale, so one `getStaticPaths` covers
 * all three without branching. Every link rendered by a design component must
 * go through this, or the first click drops the visitor out of the design
 * they are previewing and back onto the live site.
 */
export function previewPath(design: string, lang: Lang, path = '/'): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  return `${BASE}/preview/${design}/${lang}${clean ? `/${clean}` : ''}`;
}

/** Strip the deploy base and the locale prefix, leaving a bare path like
 *  `/cars` — the form `localePath` expects back. */
export function stripLocale(pathname: string): string {
  let p = pathname;
  if (BASE && (p === BASE || p.startsWith(BASE + '/'))) p = p.slice(BASE.length) || '/';
  const parts = p.split('/').filter(Boolean);
  if ((locales as readonly string[]).includes(parts[0] ?? '')) parts.shift();
  return '/' + parts.join('/');
}

/** Pick a localized string, falling back through hy -> en rather than blank. */
export function pick(field: Record<string, string> | undefined, lang: Lang): string {
  if (!field) return '';
  return field[lang] || field[defaultLang] || field.en || '';
}

/* ------------------------------------------------------------ formatting */

const AMD_LOCALE: Record<Lang, string> = { hy: 'hy-AM', ru: 'ru-RU', en: 'en-US' };

/** Thin-space grouping, no decimals. AMD is never quoted in luma. */
export function formatAmd(value: number, lang: Lang = defaultLang): string {
  return new Intl.NumberFormat(AMD_LOCALE[lang], { maximumFractionDigits: 0 })
    .format(Math.round(value))
    .replace(/[\u00A0,]/g, '\u202F');
}

export function slugOf(car: { brand: string; model: string; year: number | null }): string {
  return [car.brand, car.model, car.year]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/* --------------------------------------------------------------- finance */

/**
 * Standard annuity payment.
 *
 *   A = P · i / (1 − (1 + i)^−n)
 *
 * where P is the financed amount, i the monthly rate, n the number of months.
 * Returns 0 for a fully-paid-up-front purchase so the UI never shows NaN.
 */
export function monthlyPayment(
  priceAmd: number,
  downPercent: number,
  termYears: number,
  annualRatePercent: number
): number {
  const principal = priceAmd * (1 - downPercent / 100);
  if (principal <= 0) return 0;

  const n = Math.round(termYears * 12);
  if (n <= 0) return principal;

  const i = annualRatePercent / 100 / 12;
  if (i === 0) return principal / n;

  return (principal * i) / (1 - Math.pow(1 + i, -n));
}

export { defaultLang, locales, type Lang };
