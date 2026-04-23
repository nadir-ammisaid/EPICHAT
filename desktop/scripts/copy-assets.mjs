import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

copyFileSync("src/error.html", "dist/error.html");

mkdirSync("dist/assets", { recursive: true });
for (const file of readdirSync("assets")) {
  copyFileSync(join("assets", file), join("dist/assets", file));
}

console.log("[build] Static assets copied");
