// Monkey runner: runs the actions of src/actions.js against EverShop and writes results/summary.json.
// Do not modify this file: the evaluation runs it unchanged.
//
// Usage: node runner/monkey.js [--seed 4103] [--events 60] [--weights clickLink=2,other=1] [--delay 500] [--headed]
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { faker } from "@faker-js/faker";
import { chromium } from "playwright";
import { actions } from "../src/actions.js";

const startedAt = new Date();
const { values: options } = parseArgs({
  options: {
    seed: { type: "string", default: "4103" },
    events: { type: "string", default: "60" },
    weights: { type: "string", default: "" },
    delay: { type: "string", default: "500" },
    headed: { type: "boolean", default: false },
  },
});
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const origin = new URL(baseUrl).origin;
const seed = Number(options.seed);
const totalEvents = Number(options.events);
const delay = Number(options.delay);

// "--weights clickLink=2,otherAction=1": relative probability of each action (1 if not listed).
function parseWeights(spec) {
  const weights = Object.fromEntries(Object.keys(actions).map((name) => [name, 1]));
  for (const pair of spec.split(",").filter(Boolean)) {
    const [name, value] = pair.split("=");
    if (!(name in actions)) throw new Error(`Acción desconocida en --weights: ${name}`);
    weights[name] = Number(value);
  }
  return weights;
}

async function sha256(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

const weights = parseWeights(options.weights);
const choices = Object.entries(weights)
  .filter(([, weight]) => weight > 0)
  .map(([value, weight]) => ({ value, weight }));

// Same seed, same weights and same application state => same sequence of events.
faker.seed(seed);

const browser = await chromium.launch({ headless: !options.headed });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(5000);

let current = 0;
const failures = [];
page.on("pageerror", (error) => {
  failures.push({ event: current, oracle: "pageerror", message: error.message, url: page.url() });
});

// Keep the monkey inside the application under test.
await page.route("**/*", (route) => {
  const request = route.request();
  const leavesApp = request.isNavigationRequest() && new URL(request.url()).origin !== origin;
  return leavesApp ? route.abort() : route.continue();
});

await page.goto(baseUrl);

const events = [];
for (current = 1; current <= totalEvents; current++) {
  const action = faker.helpers.weightedArrayElement(choices);
  const from = page.url();
  try {
    const { skipped, ...detail } = (await actions[action](page, { faker, origin })) ?? {};
    await page.waitForLoadState("load");
    await page.waitForTimeout(delay);
    const outcome = skipped ? "skipped" : "ok";
    events.push({ event: current, action, from, to: page.url(), outcome, detail: skipped ? { skipped } : detail });
  } catch (error) {
    events.push({ event: current, action, from, to: page.url(), outcome: "error", detail: { message: error.message.split("\n")[0] } });
  }
}

await browser.close();

const summary = {
  taller: "monkey-testing",
  runner: { files: { "runner/monkey.js": await sha256(import.meta.filename) } },
  config: { seed, events: totalEvents, weights, delay },
  environment: { node: process.version, baseUrl },
  results: { actions: Object.keys(actions), events, failures },
  artifacts: [],
  startedAt: startedAt.toISOString(),
  durationMs: Date.now() - startedAt.getTime(),
};
await mkdir("results", { recursive: true });
await writeFile("results/summary.json", `${JSON.stringify(summary, null, 2)}\n`);
const visited = new Set(events.map((event) => event.to)).size;
console.log(`Semilla ${seed}: ${events.length} eventos, ${visited} URL distintas, ${failures.length} fallos.`);
console.log("Resumen: results/summary.json");
