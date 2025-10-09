// orm/db.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import settings from '../../../settings.js';

const db = settings.DATABASE;

let dbInstance = null;

export async function getDB() {
  if (!dbInstance) {
    dbInstance = await open({
      filename: db,
      driver: sqlite3.Database,
    });
  }
  return dbInstance;
}


// Simple query helpers
export async function runQuery(sql, params = []) {
  const db = await getDB();
  return db.all(sql, params); // returns array of rows
}

export async function runExecute(sql, params = []) {
  const db = await getDB();
  return db.run(sql, params); // for INSERT/UPDATE/DELETE
}