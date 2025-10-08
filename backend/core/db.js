import Database from 'better-sqlite3';
import settings from '../settings.js';

const db = new Database(settings.DATABASE);

export function runQuery(sql, params = []) {
  return db.prepare(sql).all(params);
}

export function runExecute(sql, params = []) {
  return db.prepare(sql).run(params);
}