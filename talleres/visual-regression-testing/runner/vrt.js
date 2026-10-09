// VRT runner: captures and compares the comparisons of vrt.config.js in both versions of the store and
// writes results/summary.json and results/report.html. Do not modify this file: the evaluation runs
// it unchanged.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import compareImages from "resemblejs/compareImages.js";
import config from "../vrt.config.js";
import { writeReport } from "./report.js";

const startedAt = new Date();
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const releaseUrl = process.env.RELEASE_URL ?? "http://localhost:3001";
const versions = { base: baseUrl, release: releaseUrl };
const defaultViewport = { width: 1280, height: 800 };
const threshold = config.threshold ?? 0.1;

const sha256 = (data) => createHash("sha256").update(data).digest("hex");

async function runStep(page, step, url) {
  if (step.goto) await page.goto(new URL(step.goto, url).href, { waitUntil: "load" });
  else if (step.click) await page.locator(step.click).click();
  else if (step.fill) await page.locator(step.fill[0]).fill(step.fill[1]);
  else if (step.waitFor) await page.locator(step.waitFor).waitFor();
  else if (step.waitForUrl) await page.waitForURL(step.waitForUrl);
  else throw new Error(`Paso desconocido: ${JSON.stringify(step)}`);
}

const artifacts = [];
async function save(file, data) {
  await writeFile(file, data);
  artifacts.push({ path: file, sha256: sha256(data) });
}

// Opens the comparison in one version, captures it before and after its steps, and returns the final
// screenshot and path.
async function capture(browser, comparison, version, url) {
  const page = await browser.newPage({ viewport: comparison.viewport ?? defaultViewport });
  await page.goto(new URL(comparison.path, url).href, { waitUntil: "load" });
  const prefix = `results/screenshots/${comparison.name}-${version}`;
  await save(`${prefix}-before-steps.png`, await page.screenshot({ fullPage: true }));
  for (const step of comparison.steps ?? []) await runStep(page, step, url);
  const image = await page.screenshot({ fullPage: true });
  await save(`${prefix}.png`, image);
  const capturedPath = new URL(page.url()).pathname;
  await page.close();
  return { image, capturedPath };
}

await mkdir("results/screenshots", { recursive: true });
const browser = await chromium.launch();
const comparisons = [];

for (const comparison of config.comparisons) {
  const shots = {};
  for (const [version, url] of Object.entries(versions)) {
    shots[version] = await capture(browser, comparison, version, url);
  }
  const result = await compareImages(shots.base.image, shots.release.image, config.resemble ?? {});
  await save(`results/screenshots/${comparison.name}-diff.png`, result.getBuffer());
  const mismatch = Number(result.misMatchPercentage);
  comparisons.push({
    name: comparison.name,
    path: comparison.path,
    viewport: comparison.viewport ?? defaultViewport,
    steps: comparison.steps ?? [],
    capturedPath: { base: shots.base.capturedPath, release: shots.release.capturedPath },
    mismatch,
    different: mismatch > threshold,
  });
  console.log(`${comparison.name}: ${mismatch}%`);
}

await browser.close();

const runnerFiles = ["runner/vrt.js", "runner/report.js"];
const summary = {
  taller: "visual-regression-testing",
  runner: {
    files: Object.fromEntries(await Promise.all(runnerFiles.map(async (file) => [file, sha256(await readFile(file))]))),
  },
  config: { baseUrl, releaseUrl, threshold, resemble: config.resemble ?? {} },
  environment: { node: process.version, baseUrl, releaseUrl },
  results: { comparisons },
  artifacts,
  startedAt: startedAt.toISOString(),
  durationMs: Date.now() - startedAt.getTime(),
};
await writeFile("results/summary.json", `${JSON.stringify(summary, null, 2)}\n`);
await writeReport(summary, "results/report.html");
console.log(`Resumen: results/summary.json · Reporte: results/report.html`);
