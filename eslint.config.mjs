import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const featureSlices = [
  "alerts",
  "auth",
  "dashboard",
  "organizations",
  "sensors",
  "servers",
  "ws",
];

const featureBoundaryConfigs = featureSlices.map((slice) => ({
  files: [`src/features/${slice}/**/*.{ts,tsx}`],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: featureSlices
          .filter((candidate) => candidate !== slice)
          .map((candidate) => ({
            group: [`@/features/${candidate}/*`],
            message: `Use the ${candidate} feature public API (\"@/features/${candidate}\") instead of deep imports.`,
          })),
      },
    ],
  },
}));

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...featureBoundaryConfigs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
