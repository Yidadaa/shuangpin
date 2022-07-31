require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  extends: ["plugin:vue/vue3-recommended", "@vue/eslint-config-typescript"],
  rules: {
    "vue/multi-word-component-names": "off",
    "vue/max-attributes-per-line": "off",
    "vue/attributes-order": "off",
    "vue/singleline-html-element-content-newline": "off",
    "vue/html-self-closing": "off",
    "vue/first-attribute-linebreak": "off",
  },
};
