// core/orm/migrations.js
import fs from "fs";
import path from "path";

import { getDB } from "./db.js";

const db= await getDB()

const MIGRATIONS_DIR = path.join(process.cwd(), "migrations");
const INDEX_FILE = path.join(MIGRATIONS_DIR, "migrations.json");

// 🔹 Utility: Ensure folder exists
function ensureMigrationsDir() {
  if (!fs.existsSync(MIGRATIONS_DIR)) fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
}

// 🔹 Load applied migrations index
function loadMigrationIndex() {
  if (!fs.existsSync(INDEX_FILE)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(INDEX_FILE, "utf-8"));
    return Array.isArray(data.applied) ? data.applied : [];
  } catch {
    return [];
  }
}

// 🔹 Save index file
function saveMigrationIndex(applied) {
  fs.writeFileSync(INDEX_FILE, JSON.stringify({ applied }, null, 2), "utf-8");
}

// 🔹 Save a new migration file
function saveMigrationFile(migrationName, content) {
  ensureMigrationsDir();
  const filename = path.join(MIGRATIONS_DIR, `${migrationName}.json`);
  fs.writeFileSync(filename, JSON.stringify(content, null, 2), "utf-8");
  console.log(`📝 Created migration file: ${filename}`);
  return filename;
}

// 🔹 Main makemigrations
export async function makemigrations(models = []) {
  console.log("🧱 Making migrations...");
  ensureMigrationsDir();

  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const index = loadMigrationIndex();
  const nextNumber = (index.length + 1).toString().padStart(4, "0");
  const migrationName = `${nextNumber}_auto_${timestamp}`;

  let migrationData = {};
  let changesDetected = false;

  for (const model of models) {
    const table = model.table;
    const currentFields = Object.entries(model.fields).reduce((acc, [name, field]) => {
      acc[name] = field.toSQL();
      return acc;
    }, {});

    migrationData[table] = currentFields;
    changesDetected = true;
  }

  if (changesDetected) {
    saveMigrationFile(migrationName, migrationData);
    index.push(migrationName);
    saveMigrationIndex(index);
    console.log(`✅ Migration '${migrationName}' recorded successfully.`);
  } else {
    console.log("📦 No changes detected, skipping migration creation.");
  }
}

// 🔹 Apply migrations (just logs for now)

/**
 * Helper: get column names and types from DB schema
 */
async function getTableSchema(db, table) {
  const rows = await db.all(`PRAGMA table_info(${table});`);
  return rows.map(r => ({
    name: r.name,
    type: r.type,
    notnull: r.notnull,
    dflt_value: r.dflt_value,
  }));
}

/**
 * Run migrations for all models automatically
 */
export async function migrate(models = []) {
  const db = await getDB();
  console.log("🚀 Applying migrations...");

  for (const model of models) {
    await model.init(); // ensure meta + Manager ready

    const table = model.table;
    const fields = model.fields;

    // 1️⃣ If table does not exist, create it fully
    const existing = await db.get(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
      [table]
    );

    if (!existing) {
      const fieldsSQL = Object.entries(fields)
        .map(([name, field]) => `${name} ${field.toSQL()}`)
        .join(", ");
      await db.run(`CREATE TABLE ${table} (${fieldsSQL});`);
      console.log(`🧱 Created new table: ${table}`);
      continue;
    }

    // 2️⃣ Compare schema with model
    const schema = await getTableSchema(db, table);
    const dbCols = schema.map(c => c.name);
    const modelCols = Object.keys(fields);

    const extraCols = dbCols.filter(c => !modelCols.includes(c));
    const missingCols = modelCols.filter(c => !dbCols.includes(c));

    if (extraCols.length === 0 && missingCols.length === 0) {
      console.log(`✅ Table "${table}" is up-to-date.`);
      continue;
    }

    console.log(`⚠️ Schema mismatch detected in "${table}":`);
    if (extraCols.length) console.log(`   ➖ Extra in DB: ${extraCols.join(", ")}`);
    if (missingCols.length) console.log(`   ➕ Missing in DB: ${missingCols.join(", ")}`);

    // 3️⃣ Handle drops first
    for (const col of extraCols) {
      console.log(`   🗑️ Dropping column: ${col}`);
      await db.run(`ALTER TABLE ${table} DROP COLUMN ${col}`);
    }

    // 4️⃣ Refresh DB schema after drops
    const refreshed = await getTableSchema(db, table);
    const refreshedCols = refreshed.map(c => c.name);

    // 5️⃣ Handle adds
    const stillMissing = modelCols.filter(c => !refreshedCols.includes(c));
    for (const col of stillMissing) {
      const field = fields[col];
      console.log(`   ➕ Adding column: ${col}`);
      await db.run(`ALTER TABLE ${table} ADD COLUMN ${col} ${field.toSQL()}`);
    }

    console.log(`✅ Table "${table}" synchronized.`);
  }

  console.log("✅ All migrations applied.");
}



export async function migrateFromFile() {
  const db = await getDB();
  const path = "./migrations.json";

  if (!fs.existsSync(path)) {
    console.log("⚠️ No migrations.json found. Run `makemigrations` first.");
    return;
  }

  const migrations = JSON.parse(fs.readFileSync(path, "utf-8"));

  console.log("🚀 Applying migrations from file...");

  for (const [table, fields] of Object.entries(migrations)) {
    const fieldsSQL = Object.entries(fields)
      .map(([name, def]) => `${name} ${def}`)
      .join(", ");

    console.log(`🧱 Ensuring table: ${table}`);
    await db.run(`CREATE TABLE IF NOT EXISTS ${table} (${fieldsSQL});`);
  }

  console.log("✅ All migrations from file applied.");
}

