import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import pkg from "./package.json";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

/** @type { import('rollup').RollupOptions[] } */
const config = [
  {
    input: "./src/server/index.ts",
    output: [
      {
        sourcemap: true,
        banner: `// ${pkg.name}: ${pkg.version}`,
        dir: "dist/server",
        esModule: true
      },
    ],
    treeshake: true,
    plugins: [
      commonjs(),
      json(),
      typescript(),
    ],
  },
  {
    input: "./src/web/index.ts",
    output: [
      {
        sourcemap: true,
        banner: `// ${pkg.name}: ${pkg.version}`,
        dir: "public/dist/browser",
        format: "module"
      },
    ],
    treeshake: true,
    plugins: [
      nodeResolve({ browser: true, mainFields: ["browser", "module"] }),
      commonjs(),
      json(),
      typescript({ target: "es6" }),
    ],
    preserveEntrySignatures: true
  },
];

export default config;
