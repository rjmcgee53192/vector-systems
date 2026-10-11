// Syntax sanity check for TypeScript sources using the TypeScript compiler API.
// Reports syntax errors only — no type checking, no module resolution.
// (Full `tsc --noEmit` is not wired yet: the TanStack Router codegen file
// `src/routeTree.gen` and `src/lib/error-component` are not in the repo,
// so project-wide typechecking cannot pass until the router setup is completed.)
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const srcDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src");

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if ([".ts", ".tsx"].includes(extname(entry))) yield full;
  }
}

let failures = 0;
let count = 0;
for (const file of walk(srcDir)) {
  count++;
  const source = readFileSync(file, "utf8");
  const out = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
    reportDiagnostics: true,
    fileName: file,
  });
  const errors = (out.diagnostics ?? []).filter(
    (d) => d.category === ts.DiagnosticCategory.Error
  );
  for (const e of errors) {
    failures++;
    console.error(`${file}: ${ts.flattenDiagnosticMessageText(e.messageText, " ")}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} syntax error(s) in ${count} files`);
  process.exit(1);
}
console.log(`All ${count} TypeScript sources parse cleanly.`);
