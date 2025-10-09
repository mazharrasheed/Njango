// core/orm/model.js
import { Manager } from "./manager.js";
import { fields } from "./fields.js";
import { getDB } from "./db.js";

export class Model {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  static fields = fields;

  static async init() {
    if (!this.table) throw new Error(`${this.name} missing table name`);

    // Django-style metadata
    this._meta = {
      table: this.table,
      fields: this.fields,
      modelName: this.name,
    };

    // Attach manager
    this.objects = new Manager(this);

    // Exceptions (like Django)
    this.DoesNotExist = class DoesNotExist extends Error {
      constructor() {
        super(`${this.name} matching query does not exist.`);
        this.name = `${this.name}.DoesNotExist`;
      }
    };

    this.MultipleObjectsReturned = class MultipleObjectsReturned extends Error {
      constructor(count) {
        super(`get() returned more than one ${this.name} -- returned ${count}!`);
        this.name = `${this.name}.MultipleObjectsReturned`;
      }
    };
  }

  // ==========================
  //  INSTANCE METHODS
  // ==========================

  async save() {
    const db = await getDB();
    const table = this.constructor.table;
    const fields = this.constructor.fields;

    const columns = Object.keys(fields).filter(k => k !== "id");
    const values = columns.map(k => this[k]);

    if (this.id) {
      const setClause = columns.map(c => `${c} = ?`).join(", ");
      await db.run(`UPDATE ${table} SET ${setClause} WHERE id = ?`, [...values, this.id]);
    } else {
      const placeholders = columns.map(() => "?").join(", ");
      const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;
      const result = await db.run(sql, values);
      this.id = result.lastID;
    }
    return this;
  }

  async delete() {
    if (!this.id) throw new Error("Cannot delete unsaved object.");
    const db = await getDB();
    const table = this.constructor.table;
    await db.run(`DELETE FROM ${table} WHERE id = ?`, [this.id]);
    return true;
  }

  toJSON() {
    const data = {};
    for (const key of Object.keys(this.constructor.fields)) {
      data[key] = this[key];
    }
    return data;
  }

  static getMeta() {
    return this._meta;
  }
}
