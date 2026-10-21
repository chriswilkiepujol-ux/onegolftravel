// ============================================================
// INTERFACE TEXT (buttons, labels, navigation) per language.
// Lives in src/_i18n/ui/<lang>.json. The build FAILS if any language
// file is missing a label the English file has.
// ============================================================
const fs = require("fs");
const path = require("path");
const site = require("./site.json");
const dir = path.join(__dirname, "..", "_i18n", "ui");
const read = (l) => JSON.parse(fs.readFileSync(path.join(dir, `${l}.json`), "utf8"));

function missing(a, b, prefix = "") {
  const out = [];
  for (const k of Object.keys(a)) {
    const key = prefix + k;
    if (!(k in b)) { out.push(key); continue; }
    if (a[k] && typeof a[k] === "object" && !Array.isArray(a[k])) out.push(...missing(a[k], b[k] || {}, key + "."));
  }
  return out;
}

module.exports = function () {
  const out = {};
  const en = read(site.defaultLocale);
  out[site.defaultLocale] = en;
  const gaps = [];
  for (const l of site.locales) {
    if (l === site.defaultLocale) continue;
    const file = path.join(dir, `${l}.json`);
    const data = fs.existsSync(file) ? read(l) : {};
    out[l] = data;
    for (const g of missing(en, data)) gaps.push(`${l}.json: ${g}`);
  }
  if (gaps.length) {
    const msg = "\n\nINTERFACE TEXT CHECK FAILED, missing in src/_i18n/ui/:\n  - " + gaps.join("\n  - ") + "\n";
    if (process.env.I18N_STRICT !== "0") throw new Error(msg);
    console.warn(msg);
  }
  return out;
};
