# Review — visual direction, then designer / developer / UX

> **2026-08-30 update — superseded by "Daylight".** Everything below describes
> earlier rounds and is kept as history only. The client reviewed five design
> directions and chose **Daylight**: white cards on a pale periwinkle ground,
> one radius, one shadow, one violet action colour, and the brand gradient used
> only in the logo and as blurred ambient light. The five proposals were built
> under `/preview/` and removed once the choice was made; they are recoverable
> at commit `55a39d9`.
>
> The palette is no longer eyeballed. It was sampled pixel-by-pixel from Ucar's
> own Instagram artwork: the logo gradient measures `#43EBFC → #4480F4 →
> #5716D5` (a true cyan, not the teal used before) and the display violet
> measures `#5D17F0`, which became `--color-signal` `#5A17EE`.
>
> **Contrast, re-audited 2026-08-30** (previous "all pairs pass AA" claims below
> are stale and predate two palette changes — ignore them):
>
> | Pair | Ratio | |
> |---|---|---|
> | `ink` on white / on `page` | 19.7 / 18.1 | AAA |
> | `ink-2` on white / on `page` | 6.8 / 6.3 | AAA |
> | `signal` on white / on `page` | 7.5 / 6.9 | AAA |
> | white on `signal` (primary pill) | 7.5 | AAA |
> | `signal` on `signal-3` (soft pill) | 6.4 | AAA |
> | white on `ink` (active chip) | 19.7 | AAA |
> | `charge` on white (available) | 5.4 | AA |
> | `danger` on white (unverified note) | 5.4 | AA |
> | `azure` on white | 4.7 | AA — decorative only |
> | `dim` on white | **3.2** | **fails AA for body text** |
>
> `--color-dim` is therefore restricted to decoration, icons and incidental
> text at large sizes (photo credits, the legal line in the footer). It must
> not carry body copy. `--color-azure` is decorative only for a different
> reason: violet is the site's single interactive colour, and a second
> blue-violet marking things as clickable would erode that.
>
> Not re-audited: white-on-photograph, which the design avoids entirely — there
> is no type over an image anywhere on the site.

## Round 2 — visual direction rebuilt

The first version used warm Yerevan-tuff rose, a serif display face and an
apricot accent. Correct client feedback: that reads as a boutique, not a car
dealership. Benchmarked against hongqi.am, whose language is the OEM standard
— near-black chrome, full-bleed key visuals, all-sans wide-tracked labels, one
saturated accent used only for actions.

| | Before | After |
|---|---|---|
| Chrome | Warm rose stone `#EAE0DC` | Graphite `#0C0D0F`; white/mist content |
| Display face | Source Serif 4 + Noto Serif Armenian | Inter, 700 weight, `-0.025em` |
| Accent | Apricot `#A44F10` on the payment | Signal red `#D6002A`, **actions only** |
| Payment figure | Coloured | White on graphite at 60px |
| Structure | One ground throughout | Dark hero band -> light spec-sheet body -> dark footer |
| Font families | 5 | 3 (both serifs dropped) |

Two rules hold the system together. **Red is an action colour** — primary
buttons, the active nav underline, a 2px rule above the payment; never a
field, never decoration. And **the payment is carried by scale, not hue**,
which is why it is plain white: a coloured price tag reads retail, a large
tabular readout reads instrument.

One bug this surfaced: `accent-color: signal` on the range inputs painted the
whole filled slider track red, putting a wide red band across the hero —
exactly what the accent rule forbids. Sliders now take the ground's contrast
colour (white on dark, ink on light) through an `.on-dark` scope.

The hero was rebuilt as three grid children so that in one column they fall
text -> car -> payment, and at `lg` the car spans both rows in column two.
That removed a void in the top-right on desktop while keeping the payment
figure above the fold at 390px.

Serifs were removed outright rather than restyled: they were the strongest
boutique signal, and dropping them cut two font families from the build.

All thirteen colour pairs in the new palette pass WCAG AA.

---

# Round 1 — designer, developer, UX

Conducted against real renders, not the source. A headless Chromium (149)
was run over the built site at 360, 390, 820 and 1440px in all three
locales; every finding below was seen on screen, and every fix was
re-shot and confirmed.

Twelve issues found, twelve fixed. Nothing here is speculative.

---

## Developer

**1. Cards never stretched to fill their grid cell.**
`<article>` was `flex flex-col` but had no `h-full`, so it sized to content
inside a stretched wrapper. Consequence: every catalogue row was ragged, and
the `mt-auto` on the price block — the whole point of which is to pin prices
to a common baseline — did nothing at all. It had been silently inert since
the component was written. → `h-full` on the article.

**2. The car detail page collapsed whenever a car had no spec data.**
Left column held image + specs, right held everything else. Three of twelve
cars have no range, battery or power figures, so their left column was a lone
image above ~500px of dead space beside a long right column. The enquiry form
was also crushed into half a column, with its two-up name/phone fields at
~280px. → Form moved to a full-width band below both columns, matching the
home page. Columns rebalanced and `lg:items-start`.

**3. Hero action buttons were ragged widths on mobile.**
`flex flex-wrap` sized each to its own content, so a long Armenian label and a
short one sat at different widths. → `flex-col sm:flex-row`, full width on
phones.

**4. Phones had no persistent call to action.**
The header CTA was `hidden sm:inline-flex`, so phone visitors — the majority
for a dealership in Armenia — paid for a two-row header and got no standing
action from it. → A sticky bottom bar with Call and Enquire, `lg:hidden`,
with `env(safe-area-inset-bottom)` and matching body padding so it never
covers the footer.

## UX

**5. The payment figure was ~1600px down on a phone.**
The single most important element in the design — the thing the whole layout
is built around — did not appear in the first screen on the primary device.
→ The hero is now three grid children instead of two. In one column they fall
text → car and payment → actions; at `lg` the card spans both rows in column
two and the original two-column layout returns. No duplicated markup. The
figure now lands inside the first 844px screen.

**6. The hero repeated an action the sticky bar already carries.**
→ Below `lg` the hero shows only "browse cars"; the sticky bar owns the
enquiry action.

**7. Slider values were being uppercased and letter-spaced.**
`.eyebrow` sets `text-transform: uppercase` and heavy tracking; the value
spans sat inside those labels and inherited it, so `7 տարի` rendered as a
label rather than as data. → `.eyebrow .value` opts back out.

## Designer

**8. The Armenian headline ran to three lines at 5.6rem.**
Armenian sets wider than Latin, so the same clamp that looked right in
Russian (two lines) was overbearing in the default locale and pushed
everything below it down. → `--text-hero` 5.6rem → 4.25rem,
`--text-title` 2.9rem → 2.55rem.

**9. Twelve identical placeholder silhouettes read as a grey wall.**
Ten of the twelve cars are SUVs or crossovers, whose profiles are nearly the
same shape, and the fill was high-contrast against its own ground. → New
`--color-stone-mute` token sits close to the placeholder background so the
silhouettes recede. When real photography arrives the layout is unchanged.

**10. Apricot appeared three times in one viewport.**
The accent was declared to mean money and the single primary action, but the
header CTA, the payment figure and the hero button were all solid apricot at
once. → `.btn-sevan`: the persistent header CTA takes Lake Sevan teal, so
apricot now reliably means money.

**11. A duplicated nav link sat alone in the footer bar.** Filler. Removed,
along with its now-unused import.

**12. `.btn-primary:hover` carried a hardcoded hex** outside the token
system. → `--color-apricot-deep`.

---

## Verified, not assumed

- Dram sign U+058F renders correctly — Inter lacks it, Noto Sans Armenian
  supplies it through the corrected stack order.
- Russian display type resolves to Source Serif 4 Cyrillic, confirming the
  font-ordering fix from the previous pass.
- No console errors on any page at any breakpoint.
- All eight text colour pairs pass WCAG AA.
- 49 pages, 0 type errors, clean-room `npm install` from the packaged output.

## Still open

- **Photography.** Each car now carries a stand-in photo from Wikimedia
  Commons (credited in the footer and per-car; see `DATA-NOTES.md`). Ucar's
  own photography should still replace these — clear `imageCredit` when it does.
- **Only one car has a range figure**, so the range bar — a deliberate
  structural device — currently draws on one card in twelve. It will read as
  a system once the spec data is filled in; until then it reads as a
  highlight on the BYD Yuan Plus.
- **Two `astro check` hints** are the unused `existsSync` / `readFile` imports
  in `scripts/scrape.mjs` (harmless; the scraper's rendered-fetch path uses
  them conditionally).
- Nothing has been tested on a real phone, only at phone dimensions in
  headless Chromium. Touch targets, momentum scroll and the safe-area inset
  should be confirmed on device.
