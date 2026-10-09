// End-to-end runner: runs the specs one at a time, in this order, and writes results/summary.json.
// customer-checkout needs the product and the store settings that the admin specs create, so run it
// on a store reset with `npm run app:reset`. Do not modify this file: the evaluation runs it unchanged.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import cypress from "cypress";

const startedAt = new Date();
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const order = ["admin-setup", "admin-product", "customer-checkout"].map((name) => `cypress/e2e/${name}.cy.js`);
const sha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");

const specs = [];
for (const spec of order.filter((file) => existsSync(file))) {
  const run = await cypress.run({ spec, quiet: true });
  if (run.status === "failed") {
    specs.push({ spec, error: run.message, tests: [] });
    continue;
  }
  const tests = run.runs.flatMap((result) =>
    result.tests.map((test) => ({ title: test.title.join(" > "), state: test.state })),
  );
  specs.push({ spec, tests });
}

const runnerFiles = ["runner/run.js", "cypress.config.js", order[0], order[1]];
const summary = {
  taller: "end-to-end-testing",
  runner: { files: Object.fromEntries(runnerFiles.map((file) => [file, sha256(file)])) },
  config: { baseUrl, order },
  environment: { node: process.version, baseUrl },
  results: { specs },
  artifacts: [],
  startedAt: startedAt.toISOString(),
  durationMs: Date.now() - startedAt.getTime(),
};
await mkdir("results", { recursive: true });
await writeFile("results/summary.json", `${JSON.stringify(summary, null, 2)}\n`);
for (const { spec, tests, error } of specs) {
  console.log(`${spec}: ${error ?? tests.map((test) => `${test.state} · ${test.title}`).join("; ")}`);
}
console.log("Resumen: results/summary.json");
