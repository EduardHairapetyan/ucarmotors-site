# Data notes

Where every fact in this repo came from, and what is still unconfirmed.
Read this before changing anything in `src/content/`.

Gathered 2026-08-29. Ucar Motors had no public website at that date —
`ucarmotors.am` resolved as an email domain only. Everything below was
assembled from their own social accounts and one aggregator listing.

---

## The verification model

Two independent flags, because they carry different risk.

| Flag | Where | What it gates |
|---|---|---|
| `verified` on a car | `src/content/cars/*.json` | Whether that car's **price** is published. False → the site shows "price on request" and emits no schema.org `Offer`. |
| `financing.verified` | `src/content/settings/site.json` | Whether the site may deploy to **production** at all. `scripts/deploy.sh` refuses while it is false. |

A model appearing in the catalogue is low-risk — Ucar's own marketing
confirms they sell it. A wrong price on a 10-million-dram car is not.

---

## Confirmed

| Fact | Value | Source |
|---|---|---|
| Legal entity | ՅՈՒՔԱՐ ՍՊԸ (Ucar LLC) | mycar.am dealer 39 |
| Email | info@ucarmotors.am (also info@ucarmotors.com) | Facebook, mycar.am |
| Phones | +374 91 466667, +374 91 466607, +374 93 466667 | Facebook, Instagram posts |
| Showroom | Verin Ptghni, Nor Taghamas, 1st St. 45, Kotayk | Facebook, mycar.am |
| Facebook | facebook.com/UcarMotors.am (~6,900 followers) | direct |
| Instagram | **@ucar__motors** — two underscores | mycar.am |
| LinkedIn | linkedin.com/company/ucar-motors | direct |
| Services | EV sales, charging stations, warranty, service, financing | their own Armenian FB tagline |

`@ucarmotors` (one underscore) is an unrelated motorcycle dealer in Istanbul.
Do not link it.

## Prices — verified, 3 cars

From the mycar.am dealer listing, in AMD:

| Car | Price | Their quoted monthly |
|---|---|---|
| Deepal S07 2025 | 10,000,000 ֏ | 170,500 ֏ |
| Mazda EZ60 200 Max 2025 | 11,700,000 ֏ | 199,500 ֏ |
| Mazda EZ60 600 Max 2025 | 11,800,000 ֏ | 201,500 ֏ |

The site does not display those quoted monthly figures. It computes payments
from `settings.financing` so that changing the rate in one place updates every
number on the site. The stored `monthlyFromAmd` is kept only as a reference —
at 13.25% / 7 years / 10% down the site computes 164,953 ֏ for the Deepal
against their quoted 170,500 ֏, so their published figure assumes a slightly
different rate or fee structure. **Ask them which.**

## Models confirmed, prices not — 9 cars

Seen in Ucar's own posts: BYD Yuan Plus, BYD Leopard 4WD Ultra, Zeekr 001,
Avatr 12, Dongfeng Nano Box, Toyota bZ4X, Volkswagen ID.4, Volkswagen
ID.6 Crozz, Honda e:NP1. All `verified: false`.

---

## Deliberately left empty

**`rangeKm` on the three priced cars.** The mycar.am listing showed `258` for
the Deepal S07 *and* `258` for the Mazda EZ60 **600** Max. A car badged 600
does not have 258 km of range, so that column is almost certainly horsepower
or a battery figure, not range. Rather than guess, the field is `null` and the
range bar simply does not draw for those cars.

The one range figure in the repo is **BYD Yuan Plus, 500 km**, because Ucar's
own LinkedIn post states "500 km / 310 miles" in words.

**Opening hours.** Seeded as Mon–Sat 10:00–19:00. This is a **placeholder**,
not a sourced fact. Confirm before launch.

---

## Images — stand-in photos from Wikimedia Commons (2026-08-29)

Every car now carries one lead photo in `public/images/cars/<slug>.jpg`, pulled from
Wikimedia Commons and credited on the car page via `imageCredit` in the JSON.
These are **stand-ins** — replace them with Ucar's own photography (and clear
the `imageCredit` field) when it arrives. CC BY-SA files oblige us to keep the
visible credit until then.

| Car | Commons file | Photographer | Licence | Identity confidence |
|---|---|---|---|---|
| Deepal S07 2025 | `Deepal S07 IAA 2025 DSC 1897` | Alexander Migl | CC BY-SA 4.0 | exact — 2025 car |
| Mazda EZ60 200 Max | `Mazda EZ-60 001` | JustAnotherCarDesigner | CC0 | exact — EZ-60 SUV (distinct from the EZ-6 sedan; 200/600 are range trims) |
| Mazda EZ60 600 Max | `Mazda EZ-60 004` | JustAnotherCarDesigner | CC0 | exact — same body, different frame |
| BYD Yuan Plus | `BYD Atto 3 1X7A6491` | Alexander Migl | CC BY-SA 4.0 | exact — Yuan Plus is sold as Atto 3 abroad |
| BYD Leopard 4WD Ultra | `2024 Fangchengbao Bao 5` | User3204 | CC BY-SA 4.0 | **moderate** — "Leopard 4WD Ultra" is a dealer string; Fangchengbao (豹 = Leopard) Bao 5 is the 4WD PHEV SUV, but confirm with Ucar |
| Zeekr 001 | `Zeekr 001 001` | JustAnotherCarDesigner | CC BY-SA 4.0 | exact |
| Avatr 12 | `Avatr 12 008` | JustAnotherCarDesigner | CC0 | exact |
| Dongfeng Nano Box | `Dongfeng EX1 Nano Box 001` | JustAnotherCarDesigner | CC BY-SA 4.0 | exact |
| Toyota bZ4X | `Toyota bZ4X 1X7A7052` | Alexander-93 | CC BY-SA 4.0 | exact |
| Volkswagen ID.4 | `Volkswagen ID.4 1X7A0360` | Alexander Migl | CC BY-SA 4.0 | exact (European ID.4; China ID.4 Crozz differs slightly) |
| Volkswagen ID.6 Crozz | `Volkswagen ID.6 Crozz 2022010302` | Evnerd | CC BY-SA 4.0 | exact |
| Honda e:NP1 | `HONDA e NP1 (HONDA VEZEL HR-V (RV)) China` | Dinkun Chen | CC BY-SA 4.0 | exact |

Full source URL: `https://commons.wikimedia.org/wiki/File:<file name>`.

---

## Ask the client before launch

1. Current financing rate, term, and down-payment range. The 13.25% / 7-year /
   10–30% figures come from a 2024-era post and gate production deploys.
2. Why their quoted monthly differs from the annuity calculation (fees? a
   different rate? a residual?).
3. Actual opening hours.
4. Whether Paruyr Sevak 44 in Yerevan is still an active location — it appears
   in older listings alongside the Verin Ptghni showroom.
5. Photography, and written permission for each image.
6. Whether prices should display in AMD only, or AMD and USD.
7. Real range/battery/power specs per model.
8. Legal entity details for the footer.
