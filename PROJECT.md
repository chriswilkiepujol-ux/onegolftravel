# PROJECT.md — One Golf Travel website

Living project doc. **If you're a future Claude session picking this up cold: read this file first, in full, before touching anything.**

**Last updated:** 21 October 2026, initial build (EN/ES/DE test site).

## 1. What this project is

The new onegolftravel.com for One Golf Travel (Max Hare, same owner as Racket Breaks / Market Integrity). International golf travel, lead-generation model: no online checkout, every package ends in a "quote me for my dates" form, everything else goes through the custom package form. Launch languages: English, Spanish, German. Benchmarks: yourgolftravel.com (the one Max likes), golfbreaks.com.

Built by Impulso Media (Chris Wilkie), project value €3,000. Rebuilt from the Racket Breaks codebase (same Eleventy architecture, same i18n approach, extended to three languages).

**Brand**: logo colours navy `#03163D` + magenta `#E6007E` (from the dotted-globe logo). Fonts Fraunces (display) + Inter + IBM Plex Mono. Light theme, photo-led, close to yourgolftravel.com in structure.

## 2. The brief from Max (meeting notes, Oct 2026)

- Destinations are number one. Category/parent pages are **countries**, each with **region** sub-pages (Scotland → St Andrews / Edinburgh & East Lothian / West Coast & Ayrshire).
- **Package lengths are 5 nights or 7 nights only** (Max, 21 Oct). Anything shorter, longer or in between is a custom package. Every package record must have `nights: 5` or `nights: 7`; the packages index filters by length and the nav links to `?nights=5` / `?nights=7`.
- Packages: "we only sell the best": good / popular / value per region. Anything else is a custom package. Targets: Scotland 15, Ireland 10, England 5, Spain 20, Morocco 5, UAE 5 (stored in `countries.json > targets`).
- Golf course pages per course: not for now (Scotland 50, England 20, Spain 50, Ireland 30, Morocco 15 is too many). The template exists and the 11 courses already on the live site have pages; adding more is one JSON record each.
- Top 10 recommended in Scotland "by us" → `/top-10-golf-courses-scotland/`. The current list is a placeholder for Max to reorder/replace.
- Contact / quote forms: click "quote me" for specific dates; prices subject to exact dates; comments box for what they want changed in the package, plus whether they are hiring cars or need transfers.
- Custom quote form: dropdowns for part of the world, exact dates or month + year, number of people (plus rounds, hotel style, courses, transport, budget).
- Tournament travel: The Masters, Ryder Cup, The Open, Solheim Cup, Race to Dubai.
- Copy and images from the old Squarespace site were reused (see section 6).

## 3. ⚠️ How this codebase works — read before editing anything

Eleventy 3 static site, Nunjucks templates, no build step beyond `npm run build`. **Never hand-edit `_site/`**, it is regenerated on every build.

All content lives in JSON:

| What | English facts + copy | Spanish copy | German copy |
|---|---|---|---|
| Countries | `src/_data/countries.json` | `src/_i18n/es/countries.json` | `src/_i18n/de/countries.json` |
| Regions | `src/_data/regions.json` | `src/_i18n/es/regions.json` | `src/_i18n/de/regions.json` |
| Packages | `src/_data/packages.json` | `src/_i18n/es/packages.json` | `src/_i18n/de/packages.json` |
| Courses | `src/_data/courses.json` | … | … |
| Hotels | `src/_data/hotels.json` | … | … |
| Tournaments | `src/_data/tournaments.json` | … | … |
| Top 10 Scotland | `src/_data/topten.json` | … | … |
| Interface text, nav, SEO titles, FAQs, static page copy | `src/_i18n/ui/en.json` | `src/_i18n/ui/es.json` | `src/_i18n/ui/de.json` |
| Brand, phone, email, WhatsApp, Formspree endpoint | `src/_data/site.json` | | |

Overlay files are keyed by the English `slug`. They hold only the translatable fields plus an optional localised `slug` (used in the URL). Shared facts (price, par, images, stars, cross-references) live only in the English file.

**The build fails if anything is missing in any language** (`src/_data/loc.js`, `src/_data/t.js`, and the `tmap` collection in `.eleventy.js`). Set `I18N_STRICT=0` locally to downgrade to warnings; never on Vercel. Spanish and German must be written natively, never translated word for word (Chris's standing rule).

**To add a package**: add a record to `packages.json` (hotel must exist in `hotels.json`, courses in `courses.json`, region in `regions.json`) and its ES + DE copy in the same commit. It then appears automatically on the country page, region page, hotel page, course pages, packages index, homepage (if `featured: true`) and in "you might also like" (the `relatedPackages` filter).

**Package tiers**: `tier: "best" | "popular" | "value"` drives the badge. `priceStatus: "confirmed" | "placeholder"` adds the "indicative price" note on the page.

**Pages**: page bodies are in `src/_includes/pages/*.njk` and are shared by all three languages. Thin wrappers per language live in `src/*.njk`, `src/es/*.njk`, `src/de/*.njk`; data pages use pagination (`src/_packages.njk` etc.). Every wrapper carries a `translationKey` so the language switcher and hreflang resolve.

**Forms**: all forms post to the Formspree endpoint in `site.json` with hidden `_site`, `_subject`, `language`, `package` / `event` fields. The custom form pre-fills from URL params (`?destination=spain&region=sotogrande&course=la-canada`), which is how every "ask about this" button works.

## 4. What exists today (22 Oct 2026)

- 6 countries (Scotland, Ireland, Spain live; England, Morocco, UAE as "coming soon" hubs that push to the custom form)
- 6 regions: St Andrews, Fife & Angus (incl. Carnoustie, Montrose, Gleneagles), Edinburgh & East Lothian, West Coast & Ayrshire, Highlands & Aberdeenshire, Dublin & Wicklow, Sotogrande & San Roque. The three Scottish regions without packages still show the coming-soon package box.
- 9 packages: Sotogrande Signature (€800, real), St Andrews Signature (€1,500, real), Dublin Signature (€1,780, real) plus 6 extras built from the other hotels on the old site with **placeholder prices**: Sotogrande Value (Encinar), Sotogrande Luxury (SO/), St Andrews Fairmont, St Andrews Town (Greyfriars), Woodstock House Exclusive, Portmarnock Links & City
- 44 courses (36 in Scotland: the 33 from Max's Google My Map 'Scotland Essential Courses' plus the St Andrews Links courses), each with a page in three languages, coordinates and a Leaflet/OpenStreetMap map on the country and region pages; 9 hotels, 5 tournaments, Top 10 Scotland, custom form, how it works, transfers, FAQs, about, contact, privacy/terms placeholders
- 180 pages, sitemap with hreflang, `robots.txt`

## 5. Open items / to confirm with Max

1. **Placeholder prices** on the 6 non-Signature packages (`priceStatus: "placeholder"`). Replace or delete.
2. **Formspree**: currently the Racket Breaks form ID. Create a One Golf Travel form (or confirm the shared inbox is fine) and set `site.json > formspree`. Submissions carry `_site: One Golf Travel` so they can be filtered.
3. Email: header uses info@onegolftravel.com; the old site footer used info@onegolftravel.eu. Confirm one.
4. Top 10 Scotland list and order.
5. Remaining packages: 12 more Scotland, 7 Ireland, 5 England, 17 Spain, 5 Morocco, 5 UAE per the brief. Need hotel, courses, price, rounds, nights per package; copy can be written from that.
6. Course pages: Scotland done from Max's map (36). England/Spain/Ireland/Morocco lists still to come from Max. Course photos: see IMAGE-CREDITS.md, rights to confirm per club before launch.
7. Legal pages (privacy, terms) are placeholders.
8. GA4 and Search Console IDs in `site.json`.
9. Images are pulled from the old Squarespace site (see IMAGE-GUIDE in section 6); some are screenshots and a few are generic. Replace with Max's originals when available. Hotel/course names are used as on the old site; same caveat as Racket Breaks about naming properties before partnerships are signed.
10. Domain: onegolftravel.com currently points to Squarespace. Switch DNS to Vercel at launch and add 301s from the old URLs (`/golf-in-spain`, `/golf-in-scot`, `/golf-in-ireland1`, `/st-andrews`, `/transfers`, `/faqs`, `/contact`) in `vercel.json`.

## 6. Images

`src/assets/images/{brand,countries,regions,courses,hotels,tournaments}/`. All webp, max 1400px wide (heroes 1800px), ~7 MB total. Sourced from the old onegolftravel.com Squarespace CDN on 21 Oct 2026; mapping in the Impulso Media project notes. Partner logos `brand/partner-2.png` … `partner-12.png` and `brand/iagto.png` are from the old site's partner strip.

## 7. Hosting

Vercel, static output `_site`, framework preset Eleventy. Connect to the GitHub repo `chriswilkiepujol-ux/onegolftravel` so pushes to `main` auto-deploy. `vercel.json` sets `cleanUrls` + `trailingSlash`.
