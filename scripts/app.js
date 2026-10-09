// Starts, stops and resets EverShop (compose.yml) with demo data and the workshops' admin user.
//
// Usage: node scripts/app.js up | down | reset | snapshot | restore
//   up        starts the containers, waits until they are healthy, loads the demo data and creates
//             the admin user (both only on a new database)
//   down      stops the containers and keeps the data
//   reset     deletes the data and runs `up` (the store returns to its initial state)
//   snapshot  saves the current data inside the database container
//   restore   returns the store to the last snapshot
import { spawnSync } from "node:child_process";
import { join } from "node:path";

export const ADMIN = { email: "admin@test.com", password: "admin123", name: "Admin" };
const root = join(import.meta.dirname, "..");

function run(command, args, { capture = false } = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
  });
  if (result.error) {
    throw new Error(`No se pudo ejecutar '${command}': ${result.error.message}`);
  }
  return result;
}

function compose(args, options) {
  const result = run("docker", ["compose", ...args], options);
  if (result.status !== 0) {
    const detail = options?.capture ? `\n${result.stdout}${result.stderr}` : "";
    throw new Error(`Falló 'docker compose ${args.join(" ")}'${detail}`);
  }
  return result;
}

function sql(query) {
  const result = compose(["exec", "-T", "database", "psql", "-U", "postgres", "-tAc", query], {
    capture: true,
  });
  return result.stdout.trim();
}

function isSeeded() {
  return Number(sql("select count(*) from product")) > 0;
}

// EverShop creates the URLs of products and categories asynchronously after they are saved: until
// then their pages answer 404. Waits until every product and category has its URL.
function waitForCatalogUrls(timeoutSeconds = 120) {
  const ready = `select
    (select count(*) from product) = (select count(*) from url_rewrite where entity_type = 'product')
    and (select count(*) from category) = (select count(*) from url_rewrite where entity_type = 'category')`;
  for (let second = 0; second < timeoutSeconds; second++) {
    if (sql(ready) === "t") return;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000); // sleep 1 s (also on Windows)
  }
  throw new Error(`EverShop no creó las URL del catálogo en ${timeoutSeconds} s.`);
}

export function up() {
  compose(["up", "--detach", "--wait"]);
  if (isSeeded()) {
    console.log("EverShop ya tiene datos de ejemplo.");
  } else {
    compose(["exec", "-T", "evershop", "npx", "evershop", "seed", "--all"], { capture: true });
    compose([
      "exec", "-T", "evershop", "npx", "evershop", "user:create",
      "--email", ADMIN.email, "--password", ADMIN.password, "--name", ADMIN.name,
    ], { capture: true });
    console.log("Datos de ejemplo y usuario administrador creados.");
  }
  waitForCatalogUrls();
  console.log(`EverShop:          http://localhost:3000 (administración: /admin, ${ADMIN.email} / ${ADMIN.password})`);
  console.log("Versión release:   http://localhost:3001");
}

export function down({ deleteData = false } = {}) {
  compose(["down", ...(deleteData ? ["--volumes"] : [])]);
}

export function reset() {
  down({ deleteData: true });
  up();
}

const SNAPSHOT = "/tmp/talleres.dump";

// Saves the current database inside the database container, so restore() returns to exactly this
// state. Two resets do not always give the same data: EverShop builds some product URLs in a
// different way depending on the order in which it processes its events after the seed.
export function snapshot() {
  compose(["exec", "-T", "database", "pg_dump", "-U", "postgres", "-Fc", "-f", SNAPSHOT, "postgres"], {
    capture: true,
  });
}

export function restore() {
  compose(["stop", "evershop", "release"], { capture: true });
  compose(["exec", "-T", "database", "pg_restore", "-U", "postgres", "--clean", "--if-exists", "-d", "postgres", SNAPSHOT], {
    capture: true,
  });
  compose(["up", "--detach", "--wait"]);
}

const commands = { up, down: () => down(), reset, snapshot, restore };

if (import.meta.main) {
  const command = commands[process.argv[2]];
  if (!command) {
    console.error("Uso: node scripts/app.js up | down | reset | snapshot | restore");
    process.exit(2);
  }
  try {
    command();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
