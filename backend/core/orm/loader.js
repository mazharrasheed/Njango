// core/orm/loader.js
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { Model } from "./models.js";
import { registerReverseRelations } from "./relations.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findModelFiles(baseDir) {
  const results = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (
        entry.isFile() &&
        entry.name.endsWith(".js") && // ✅ FIXED HERE
        fullPath.includes(`${path.sep}models${path.sep}`)
      ) {
        results.push(fullPath);
      }
    }
  }

  walk(baseDir);
  return results;
}

export async function loadModels(baseDir = path.resolve(__dirname, "../../")) {
  console.log("🧭 Searching for models in:", baseDir);

  const modelFiles = findModelFiles(baseDir);
  console.log(`📂 Found model files:`, modelFiles.map(f => path.relative(baseDir, f)));

  const models = [];

  for (const file of modelFiles) {
    const modulePath = pathToFileURL(file).href;
    const module = await import(modulePath);

    for (const exported of Object.values(module)) {
      if (typeof exported === "function" && exported.prototype instanceof Model) {
        models.push(exported);
        await exported.init();
      }
    }
  }

  console.log(`📦 Loaded ${models.length} models: ${models.map(m => m.name).join(", ")}`);
  return models;
}

registerReverseRelations(await loadModels())