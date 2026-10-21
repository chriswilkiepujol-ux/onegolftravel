// Global computed data: page titles and descriptions resolved per language.
// Static pages set `pageKey`; data pages set `title`/`description` in their own
// eleventyComputed with the record in scope.
module.exports = {
  layout: "layouts/base.njk",
  eleventyComputed: {
    title: (data) => {
      if (data.title) return data.title;
      const T = data.t && data.t[data.locale || "en"];
      if (T && data.pageKey && T.seo[data.pageKey]) return T.seo[data.pageKey].title + (data.pageKey === "home" ? "" : T.titleSuffix);
      return "One Golf Travel";
    },
    description: (data) => {
      if (data.description) return data.description;
      const T = data.t && data.t[data.locale || "en"];
      if (T && data.pageKey && T.seo[data.pageKey]) return T.seo[data.pageKey].description;
      return "";
    },
  },
};
