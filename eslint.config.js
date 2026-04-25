module.exports = [
  ...require("@pallad/eslint-config"),
  {
    rules: {
      "@typescript-eslint/no-useless-constructor": ["off"],
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-restricted-syntax": ["off"],
    },
  },
];
