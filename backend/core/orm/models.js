import { Manager } from "./manager.js";
import { fields } from "./fields.js";

export class Model {
  static async init() {
    if (!this.table) throw new Error(`${this.name} missing table name`);
    this._meta = { table: this.table, fields: this.fields };
    this.objects = new Manager(this);
  }

  static fields=fields
}
