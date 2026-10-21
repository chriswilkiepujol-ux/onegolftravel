// Next 18 months as "Month YYYY" labels per locale, for the quote forms.
module.exports = function () {
  const names = {
    en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
    es: ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"],
    de: ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"],
  };
  const out = {};
  const now = new Date();
  for (const l of Object.keys(names)) {
    out[l] = [];
    for (let i = 1; i <= 18; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      out[l].push(`${names[l][d.getMonth()]} ${d.getFullYear()}`);
    }
  }
  return out;
};
