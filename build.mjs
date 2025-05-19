// TODO: Find out why this decision was made...
// import { build } from "esbuild";
// import { fileURLToPath } from "url";
// import { dirname, resolve } from "path";
//
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
//
// build({
//   entryPoints: [resolve(__dirname, "main.mts")],
//   bundle: true,
//   outfile: resolve(__dirname, "built/main.mjs"),
//   platform: "node",
//   format: "esm",
//   tsconfig: resolve(__dirname, "tsconfig.json"),
// }).catch(() => process.exit(1));
