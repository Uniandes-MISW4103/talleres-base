// BDD runner: World, browser lifecycle and results/summary.json. Do not modify this file: the
// evaluation runs it unchanged. Step definitions use this.page, this.context and this.url(path).
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  After,
  AfterAll,
  Before,
  BeforeAll,
  Status,
  World,
  setDefaultTimeout,
  setWorldConstructor,
} from "@cucumber/cucumber";
import { chromium } from "@playwright/test";

setDefaultTimeout(30_000);

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const startedAt = new Date();

class StoreWorld extends World {
  url(path) {
    return new URL(path, baseUrl).href;
  }
}
setWorldConstructor(StoreWorld);

let browser;
const scenarios = [];

BeforeAll(async function () {
  browser = await chromium.launch({ headless: process.env.HEADED !== "1" });
});

// Every scenario gets a new browser context: no cookies, cart or session from other scenarios.
// Visited pages are recorded for every page of the context, including pages opened in steps.
Before(async function () {
  this.context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  this.visited = new Set();
  const record = (page) =>
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) {
        const url = new URL(frame.url());
        this.visited.add(url.pathname + url.search);
      }
    });
  this.context.on("page", record);
  this.page = await this.context.newPage();
});

After(async function ({ pickle, result }) {
  if (result.status === Status.FAILED && this.page && !this.page.isClosed()) {
    this.attach(await this.page.screenshot({ fullPage: true }), "image/png");
  }
  scenarios.push({
    uri: pickle.uri.replaceAll("\\", "/"),
    name: pickle.name,
    tags: pickle.tags.map((tag) => tag.name),
    status: result.status,
    fromOutline: pickle.astNodeIds.length > 1,
    steps: pickle.steps.length,
    visited: [...this.visited],
  });
  await this.context.close();
});

AfterAll(async function () {
  await browser.close();
  const passed = scenarios.filter((scenario) => scenario.status === Status.PASSED).length;
  const sha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
  const summary = {
    taller: "behavior-driven-development",
    runner: { files: { "runner/world.js": sha256("runner/world.js"), "cucumber.js": sha256("cucumber.js") } },
    config: { baseUrl },
    environment: { node: process.version, baseUrl },
    results: { total: scenarios.length, passed, failed: scenarios.length - passed, scenarios },
    artifacts: [],
    startedAt: startedAt.toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
  };
  mkdirSync("results", { recursive: true });
  writeFileSync("results/summary.json", `${JSON.stringify(summary, null, 2)}\n`);
});
