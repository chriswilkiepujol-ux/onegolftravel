const markdownIt = require("markdown-it");
const md = new markdownIt({ html: true });
const site = require("./src/_data/site.json");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.ignores.add("src/_i18n/**");

  // ---- Lookups ----
  const by = (arr, key, val) => (arr || []).find((x) => x && x[key] === val);
  eleventyConfig.addFilter("findBy", by);
  eleventyConfig.addFilter("findCountry", (countries, slug) => by(countries, "id", slug));
  eleventyConfig.addFilter("findRegion", (regions, slug) => by(regions, "id", slug));
  eleventyConfig.addFilter("findHotel", (hotels, slug) => by(hotels, "id", slug));
  eleventyConfig.addFilter("findCourse", (courses, slug) => by(courses, "id", slug));
  eleventyConfig.addFilter("findTournament", (ts, slug) => by(ts, "id", slug));

  eleventyConfig.addFilter("regionsForCountry", (regions, slug) => (regions || []).filter((r) => r.country === slug));
  eleventyConfig.addFilter("packagesForCountry", (pkgs, slug) => (pkgs || []).filter((p) => p.country === slug));
  eleventyConfig.addFilter("packagesForRegion", (pkgs, slug) => (pkgs || []).filter((p) => p.region === slug));
  eleventyConfig.addFilter("packagesForHotel", (pkgs, slug) => (pkgs || []).filter((p) => p.hotel === slug));
  eleventyConfig.addFilter("packagesForCourse", (pkgs, slug) => (pkgs || []).filter((p) => (p.courses || []).includes(slug)));
  eleventyConfig.addFilter("coursesForRegion", (courses, slug) => (courses || []).filter((c) => c.region === slug));
  eleventyConfig.addFilter("coursesForCountry", (courses, slug) => (courses || []).filter((c) => c.country === slug));
  eleventyConfig.addFilter("hotelsForRegion", (hotels, slug) => (hotels || []).filter((h) => h.region === slug));
  eleventyConfig.addFilter("hotelsForCountry", (hotels, slug) => (hotels || []).filter((h) => h.country === slug));
  eleventyConfig.addFilter("coursesBySlugs", (courses, slugs) => (slugs || []).map((s) => by(courses, "id", s)).filter(Boolean));
  eleventyConfig.addFilter("featured", (pkgs) => (pkgs || []).filter((p) => p.featured));
  eleventyConfig.addFilter("live", (items) => (items || []).filter((i) => i.status !== "coming-soon"));
  eleventyConfig.addFilter("topTen", (courses) => (courses || []).filter((c) => c.topTen).sort((a, b) => a.topTen - b.topTen));
  eleventyConfig.addFilter("where", (arr, key, val) => (arr || []).filter((x) => x && x[key] === val));
  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));

  // THE CROSS-LINKING ENGINE: related packages, same region first, then same
  // country, then same tier. Add a package to packages.json and it starts
  // appearing in other relevant pages with zero manual linking.
  eleventyConfig.addFilter("relatedPackages", (packages, current, limit = 3) => {
    const others = (packages || []).filter((p) => p.id !== current.id);
    const ranked = [
      ...others.filter((p) => p.region === current.region),
      ...others.filter((p) => p.region !== current.region && p.country === current.country),
      ...others.filter((p) => p.country !== current.country && p.tier === current.tier),
      ...others,
    ];
    const seen = new Set();
    const out = [];
    for (const p of ranked) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      out.push(p);
      if (out.length >= limit) break;
    }
    return out;
  });

  // ---- Languages ----
  eleventyConfig.addFilter("fmt", (str, vars = {}) =>
    String(str == null ? "" : str).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m))
  );
  eleventyConfig.addFilter("money", (n, locale = "en") => {
    const s = Number(n).toLocaleString(locale === "en" ? "en-GB" : locale === "es" ? "es-ES" : "de-DE");
    return locale === "en" ? `€${s}` : `${s} €`;
  });

  // Pairs every page with its versions in the other languages (via `translationKey`)
  // so each page can link to the others (hreflang + language switcher).
  // The build FAILS if any page is missing a language version.
  eleventyConfig.addCollection("tmap", (api) => {
    const map = {};
    const problems = [];
    for (const item of api.getAll()) {
      if (!item.url || !item.outputPath || !String(item.outputPath).endsWith(".html")) continue;
      const key = item.data.translationKey;
      const locale = item.data.locale || site.defaultLocale;
      if (!key) { problems.push(`${item.inputPath} (${item.url}) has no translationKey`); continue; }
      map[key] = map[key] || {};
      if (map[key][locale]) problems.push(`translationKey "${key}" is used twice in ${locale} (${map[key][locale]} and ${item.url})`);
      map[key][locale] = item.url;
      if (item.data.onlyLocale) map[key].only = true;
    }
    for (const [key, v] of Object.entries(map)) {
      if (v.only) continue;
      for (const l of site.locales) if (!v[l]) problems.push(`"${key}" has no ${l.toUpperCase()} version (exists as ${Object.values(v).join(", ")})`);
    }
    if (problems.length) {
      const msg = "\n\nLANGUAGE PAIRING CHECK FAILED:\n  - " + problems.join("\n  - ") + "\n";
      if (process.env.I18N_STRICT !== "0") throw new Error(msg);
      console.warn(msg);
    }
    return map;
  });

  eleventyConfig.addFilter("markdown", (content) => md.render(content || ""));
  eleventyConfig.addFilter("jsonStr", (str) => JSON.stringify(str == null ? "" : String(str)));
  // Normalises text that may already contain HTML entities (from computed data)
  // so it is escaped exactly once in <title>/<meta>.
  const unesc = (s) => String(s == null ? "" : s).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  eleventyConfig.addFilter("he", (s) => esc(unesc(s)));
  eleventyConfig.addFilter("stripTags", (s) => String(s == null ? "" : s).replace(/<[^>]+>/g, ""));

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
