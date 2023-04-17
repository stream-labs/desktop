module.exports = {
  plugins: ['stylelint-less'],
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recess-order',
    'stylelint-config-prettier',
  ],
  rules: {
    // ルールは随時追加する
    'selector-class-pattern': null,
    'no-descending-specificity': null,
    'selector-not-notation': 'simple',
  },
  overrides: [
    {
      files: ['**/*{.html,.vue}'],
      customSyntax: 'postcss-html',
    },
    {
      files: ['**/*.less'],
      customSyntax: 'postcss-less',
    },
  ],
};
