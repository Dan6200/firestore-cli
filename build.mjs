import { build } from "esbuild";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { builtinModules } from "module";
import { readFile, writeFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outfile = resolve(__dirname, "built/main.mjs");

async function buildAndAddShebang() {
  try {
    // 1. Run esbuild with the banner to fix the dynamic require issue
    await build({
      entryPoints: [resolve(__dirname, "main.mts")],
      bundle: true,
      outfile: outfile,
      platform: "node",
      format: "esm",
      tsconfig: resolve(__dirname, "tsconfig.json"),
      external: builtinModules,
      banner: { js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);' },
    });

    // 2. Read the bundled output
    const content = await readFile(outfile, "utf8");

    // 3. Prepend the shebang
    const finalContent = `#!/usr/bin/env node\n${content}`;

    // 4. Write the final content back to the file
    await writeFile(outfile, finalContent);

    console.log("Build successful!");

  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

buildAndAddShebang();