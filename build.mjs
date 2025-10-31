import { build } from "esbuild";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { builtinModules } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

build({
  entryPoints: [resolve(__dirname, "main.mts")],
  bundle: true,
  outfile: resolve(__dirname, "built/main.mjs"),
  platform: "node",
  format: "esm",
  tsconfig: resolve(__dirname, "tsconfig.json"),
  external: [...builtinModules, "commander"],
  banner: { js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);' },
}).catch(() => process.exit(1));