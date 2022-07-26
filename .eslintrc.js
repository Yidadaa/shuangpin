require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  extends: ["plugin:vue/vue3-recommended", "@vue/eslint-config-typescript"],
  rules: {
    // override/add rules settings here, such as:
    // 'vue/no-unused-vars': 'error'
    "vue/multi-word-component-names": "off",
    "vue/max-attributes-per-line": "off",
  },
};
