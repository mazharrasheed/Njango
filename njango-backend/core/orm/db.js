// orm/db.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";

let dbInstance = null;

export async function getDB() {
  if (!dbInstance) {
    dbInstance = await open({
      filename: "./njango.sqlite3",
      driver: sqlite3.Database,
    });
  }
  return dbInstance;
}
