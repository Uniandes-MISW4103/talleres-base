// Installs every workshop and the browser it needs (npm install and npm run setup in each folder).
// It is the root package's postinstall, so `npm install` at the root prepares all the workshops.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const talleres = join(import.meta.dirname, "..", "talleres");

for (const taller of readdirSync(talleres).sort()) {
  const dir = join(talleres, taller);
  if (!existsSync(join(dir, "package.json"))) continue;
  for (const args of [["install", "--no-audit", "--no-fund"], ["run", "setup", "--if-present"]]) {
    console.log(`\n> [${taller}] npm ${args.join(" ")}`);
    const result = spawnSync("npm", args, {
      cwd: dir,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}
