// ============================================================
// LOCALISED DATA (EN + ES + DE)
// ------------------------------------------------------------
// Every record (country, region, course, hotel, package, tournament) lives
// ONCE in src/_data/<type>.json. That file holds the shared facts (prices,
// photos, par, yardage, links) plus the English copy.
//
// The Spanish copy lives in src/_i18n/es/<type>.json and the German copy in
// src/_i18n/de/<type>.json, keyed by the record's English slug. Both are
// written as original copy for that market, never as a translation.
//
// This file merges them and gives every record a `url` for its locale.
// If ANY record is missing its Spanish or German copy (or a required field),
// the build FAILS. Nothing goes live in one language only.
// Set I18N_STRICT=0 to turn the errors into warnings while working locally.
// ============================================================
const fs = require("fs");
const path = require("path");

const DATA = path.join(__dirname);
const I18N = path.join(__dirname, "..", "_i18n");
const site = require("./site.json");

const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

// URL patterns per locale. {slug} = record slug (localised slug where one exists).
// {country} = the parent country slug (localised), used by regions.
const ROUTES = {
  en: {
    countries: "/destinations/{slug}/",
    regions: "/destinations/{country}/{slug}/",
    packages: "/golf-packages/{slug}/",
    courses: "/golf-courses/{slug}/",
    hotels: "/hotels/{slug}/",
    tournaments: "/tournaments/{slug}/",
  },
  es: {
    countries: "/es/destinos/{slug}/",
    regions: "/es/destinos/{country}/{slug}/",
    packages: "/es/paquetes-de-golf/{slug}/",
    courses: "/es/campos-de-golf/{slug}/",
    hotels: "/es/hoteles/{slug}/",
    tournaments: "/es/torneos/{slug}/",
  },
  de: {
    countries: "/de/reiseziele/{slug}/",
    regions: "/de/reiseziele/{country}/{slug}/",
    packages: "/de/golfreisen/{slug}/",
    courses: "/de/golfplaetze/{slug}/",
    hotels: "/de/hotels/{slug}/",
    tournaments: "/de/turniere/{slug}/",
  },
};

// Fields every localised record MUST have. "?field" = required only when the
// English record has that field filled in.
const REQUIRED = {
  countries: ["name", "lede", "intro", "?faqs"],
  regions: ["name", "lede", "intro", "stats", "faqs"],
  courses: ["summary", "about", "?signature", "facilities"],
  hotels: ["location", "about", "facilities"],
  packages: ["title", "location", "board", "includes", "itinerary", "aboutHotel", "?note"],
  tournaments: ["name", "lede", "intro", "?dates", "includes"],
  topten: ["name", "blurb"],
};

const filled = (v) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);

const fmtPrice = (n, locale) => {
  const s = Number(n).toLocaleString(locale === "en" ? "en-GB" : locale === "es" ? "es-ES" : "de-DE");
  return locale === "en" ? `€${s}` : `${s} €`;
};

module.exports = function () {
  const strict = process.env.I18N_STRICT !== "0";
  const problems = [];
  const out = {};
  for (const l of site.locales) out[l] = {};

  for (const type of Object.keys(REQUIRED)) {
    const base = read(path.join(DATA, `${type}.json`));
    const slugs = new Set(base.map((r) => r.slug));

    for (const locale of site.locales) {
      const isDefault = locale === site.defaultLocale;
      const overlayPath = path.join(I18N, locale, `${type}.json`);
      const overlay = isDefault ? {} : fs.existsSync(overlayPath) ? read(overlayPath) : {};

      if (!isDefault) {
        for (const k of Object.keys(overlay)) {
          if (!slugs.has(k)) problems.push(`${locale}/${type}.json has an entry "${k}" with no matching English record`);
        }
      }

      out[locale][type] = base
        .map((r) => {
          let merged;
          if (isDefault) {
            merged = { ...r, id: r.slug };
          } else {
            const o = overlay[r.slug];
            if (!o) {
              problems.push(`${type} "${r.slug}" has no ${locale.toUpperCase()} copy (add it to src/_i18n/${locale}/${type}.json)`);
              return null;
            }
            for (const f of REQUIRED[type]) {
              const optional = f.startsWith("?");
              const key = f.replace("?", "");
              if (optional && !filled(r[key])) continue;
              if (!filled(o[key])) problems.push(`${type} "${r.slug}" is missing ${locale.toUpperCase()} "${key}"`);
            }
            merged = { ...r, ...o, id: r.slug, slug: o.slug || r.slug };
          }
          if (type === "packages") {
            merged.priceDisplay = fmtPrice(r.price, locale);
            merged.priceValue = r.price;
            merged.priceCurrency = "EUR";
          }
          return merged;
        })
        .filter(Boolean);
    }
  }

  // Countries marked "coming-soon" only get their hub page: their regions, packages, courses and hotels
  // stay in the JSON (so the work is kept) but are not published until the country goes live.
  for (const locale of site.locales) {
    const D = out[locale];
    const held = new Set(D.countries.filter((c) => c.status === "coming-soon").map((c) => c.id));
    const regionCountry = Object.fromEntries(D.regions.map((r) => [r.id, r.country]));
    const isHeld = (r) => held.has(r.country || regionCountry[r.region]);
    for (const type of ["regions", "packages", "courses", "hotels"]) D[type] = D[type].filter((r) => !isHeld(r));
  }

  // URLs: regions need their (localised) country slug, so resolve after merging.
  for (const locale of site.locales) {
    const D = out[locale];
    const countryBySlug = Object.fromEntries(D.countries.map((c) => [c.id, c]));
    for (const type of Object.keys(REQUIRED)) {
      for (const r of D[type]) {
        if (!ROUTES[locale][type]) continue;
        let url = ROUTES[locale][type].replace("{slug}", r.slug);
        if (type === "regions") {
          const c = countryBySlug[r.country];
          if (!c) problems.push(`region "${r.id}" points at unknown country "${r.country}"`);
          url = url.replace("{country}", c ? c.slug : r.country);
        }
        r.url = url;
      }
    }
  }

  if (problems.length) {
    const msg = "\n\nLANGUAGE COPY CHECK FAILED, the site will not build until every item has copy in every language:\n  - " + problems.join("\n  - ") + "\n";
    if (strict) throw new Error(msg);
    console.warn(msg);
  }
  return out;
};
