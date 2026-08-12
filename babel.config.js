module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo يضيف تلقائيًا إضافة Reanimated و alias الـ paths
    // من tsconfig — فمش محتاجين plugins يدوية هنا.
    presets: ["babel-preset-expo"],
  };
};
