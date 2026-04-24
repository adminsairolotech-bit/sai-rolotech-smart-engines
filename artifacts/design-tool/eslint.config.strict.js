import base from "./eslint.config.js";

// Strict mode is opt-in. It lets us gradually tighten lint without breaking dev.
// Run with: pnpm -C artifacts/design-tool lint:strict
export default [
  ...base,
  {
    rules: {
      // Strict mode is phased-in. Start with a tiny set of “real bugs”.
      // (We deliberately do NOT error on `any` yet because the codebase
      // has existing `any` usage that will be migrated gradually.)
      "react-hooks/rules-of-hooks": "warn"
    },
  },
];

