import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Cloudflare Pages (production, ucarmotors.am) is the default build: apex
// domain, no base path. The GitHub Pages deploy is a throwaway test mirror
// served from a repo subpath — its workflow sets GITHUB_PAGES=true, which
// switches the site URL and adds `base`. Every internal link and asset URL
// goes through `localePath` / `asset` in src/i18n/utils.ts (which read
// `import.meta.env.BASE_URL`), and Base.astro derives canonical / hreflang /
// schema URLs the same way, so both targets stay correct from one codebase.
const GH_PAGES = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  site: GH_PAGES ? 'https://eduardhairapetyan.github.io' : 'https://ucarmotors.am',
  base: GH_PAGES ? '/ucarmotors-site' : undefined,
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'hy',
    locales: ['hy', 'ru', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      // `/preview/*` is the design-comparison tree — throwaway, noindex, and
      // ~200 URLs. Keeping it out leaves the sitemap the smoke tests check.
      filter: (page) => !/\/preview(\/|$)/.test(page),
      i18n: { defaultLocale: 'hy', locales: { hy: 'hy-AM', ru: 'ru-RU', en: 'en' } },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
  build: { inlineStylesheets: 'auto' },
});
