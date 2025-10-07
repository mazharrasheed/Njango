import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

// Recursively find all models.js files in the project
function findModelsFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(findModelsFiles(filePath));
        } else if (file === "models.js") {
            results.push(filePath);
        }
    }
    return results;
}

const projectDir = path.resolve(process.cwd());
const modelsFiles = findModelsFiles(projectDir);

export async function getAllModels() {
    const allModels = [];
    for (const modelsPath of modelsFiles) {
        const fileUrl = pathToFileURL(modelsPath).href;
        const modelsModule = await import(fileUrl);
        if (modelsModule.default) {
            allModels.push(...modelsModule.default);
        }
    }

    return allModels;

}

