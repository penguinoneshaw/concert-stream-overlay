import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { copy } from "@web/rollup-plugin-copy";
import { rollupPluginHTML as html } from "@web/rollup-plugin-html";
import { default as minifyHTML } from "rollup-plugin-minify-html-literals";
import summary from "rollup-plugin-summary";
import worker from "rollup-plugin-web-worker-loader";
import pkg from "./package.json" with { type: "json" };

/** @type { import('rollup').RollupOptions[] } */
const config = [
  {
    input: "./src/server/index.ts",
    output: [
      {
        sourcemap: true,
        dir: "dist/server",
        format: "module",
      },
    ],
    treeshake: true,
    plugins: [json(), worker(), typescript(), summary()],
    external: ["http", "path", "fs/promises", ...Object.keys(pkg.dependencies)],
    preserveEntrySignatures: true,
  },
  {
    input: "./src/html/*.html",
    output: [
      {
        sourcemap: true,
        banner: `// ${pkg.name}: ${pkg.version}`,
        dir: "dist/public",
        format: "module",
      },
    ],
    treeshake: true,
    plugins: [
      html(),
      nodeResolve({ browser: true, mainFields: ["browser", "module"] }),
      commonjs(),
      json(),
      worker(),
      typescript({ target: "es2019" }),
      minifyHTML.default(),
      terser({
        ecma: 2020,
        module: true,
        warnings: true,
      }),
      summary(),
      copy({
        patterns: ["*"],
        rootDir: "./static",
      }),
      copy({
        patterns: "./data/*.yaml",
      }),
    ],
    preserveEntrySignatures: true,
  },
];

export default config;
