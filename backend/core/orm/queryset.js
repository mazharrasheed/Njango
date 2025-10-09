// core/orm/queryset.js
import { getDB } from "./db.js";

/**
 * Enhanced Django-style QuerySet for NDjango.
 * - Chainable and immutable (builder-pattern)
 * - Fully async
 * - Works with Manager (which instantiates `new QuerySet(Model)`)
 *
 * Supported (Django-like) methods:
 * - filter, exclude, orderBy / order_by, limit, offset, distinct
 * - values, values_list, only, defer
 * - annotate, aggregate, groupBy
 * - union / intersect / except
 * - first / last / get / all / exists / count / in_bulk
 * - create / bulkCreate / bulkUpdate / update / updateOrCreate / getOrCreate / delete
 * - iterator (async generator), explain, alias, extra (lightweight)
 * - select_related / prefetch_related (stubs/light)
 *
 * Note: This QuerySet returns model instances (new Model(row)) when not using values/values_list.
 */

function escapeIdentifier(column) {
  // Very basic identifier check — expand if needed
  if (typeof column !== "string") throw new Error("Identifier must be string");
  if (!/^[\w.]+$/.test(column)) throw new Error(`Invalid identifier: ${column}`);
  return column;
}

function isObjEmpty(obj) {
  return !obj || Object.keys(obj).length === 0;
}

/** Utility to clone arrays/objects safely */
function cloneDeep(state) {
  return JSON.parse(JSON.stringify(state));
}

export class QuerySet {
  constructor(model, state = {}) {
    this.model = model;

    // core state
    this._filters = state._filters || {}; // exact equals map {col: val}
    this._exclude = state._exclude || {}; // exclude equals map
    this._orderBy = state._orderBy || null; // array or string
    this._limit = state._limit ?? null;
    this._offset = state._offset ?? null;
    this._distinct = !!state._distinct;

    // projection
    this._valuesFields = state._valuesFields || null; // array of column names
    this._valuesList = !!state._valuesList;
    this._onlyFields = state._onlyFields || null; // array to only select (model instances)
    this._deferFields = state._deferFields || null; // array to omit
    this._onlyRaw = !!state._onlyRaw; // return raw rows

    // annotate / aggregate / group
    this._annotate = state._annotate || null; // { alias: {fn, field} }
    this._groupBy = state._groupBy || null; // array

    // compound set operations
    this._compound = state._compound || null; // { type, qs, all }

    // extras & aliases
    this._extra = state._extra || null; // {select:[], where:[], params:[]}
    this._alias = state._alias || null;

    // relation hints (not fully implemented)
    this._selectRelated = state._selectRelated || null;
    this._prefetchRelated = state._prefetchRelated || null;
  }

  // -------------------- Internal helpers --------------------

  _clone() {
    return new QuerySet(this.model, {
      _filters: cloneDeep(this._filters),
      _exclude: cloneDeep(this._exclude),
      _orderBy: Array.isArray(this._orderBy) ? [...this._orderBy] : this._orderBy,
      _limit: this._limit,
      _offset: this._offset,
      _distinct: this._distinct,
      _valuesFields: this._valuesFields ? [...this._valuesFields] : null,
      _valuesList: this._valuesList,
      _onlyFields: this._onlyFields ? [...this._onlyFields] : null,
      _deferFields: this._deferFields ? [...this._deferFields] : null,
      _onlyRaw: this._onlyRaw,
      _annotate: this._annotate ? cloneDeep(this._annotate) : null,
      _groupBy: this._groupBy ? [...this._groupBy] : null,
      _compound: this._compound ? { ...this._compound } : null,
      _extra: this._extra ? cloneDeep(this._extra) : null,
      _alias: this._alias,
      _selectRelated: this._selectRelated ? [...this._selectRelated] : null,
      _prefetchRelated: this._prefetchRelated ? [...this._prefetchRelated] : null,
    });
  }

  _buildWhereParts(filters, exclude = false) {
    const parts = [];
    const params = [];
    for (const [k, v] of Object.entries(filters || {})) {
      // simple handling: IN, null, direct equality
      if (Array.isArray(v)) {
        if (v.length === 0) {
          parts.push(exclude ? "1" : "0");
        } else {
          parts.push(`${escapeIdentifier(k)} ${exclude ? "NOT IN" : "IN"} (${v.map(() => "?").join(",")})`);
          params.push(...v);
        }
      } else if (v === null) {
        parts.push(`${escapeIdentifier(k)} ${exclude ? "IS NOT NULL" : "IS NULL"}`);
      } else {
        parts.push(`${escapeIdentifier(k)} ${exclude ? "!=" : "="} ?`);
        params.push(v);
      }
    }
    return { parts, params };
  }

  _buildWhereClause() {
    const whereParts = [];
    const params = [];

    const f = this._buildWhereParts(this._filters, false);
    whereParts.push(...f.parts);
    params.push(...f.params);

    const ex = this._buildWhereParts(this._exclude, true);
    whereParts.push(...ex.parts);
    params.push(...ex.params);

    if (this._extra && this._extra.where && this._extra.where.length) {
      whereParts.push(...this._extra.where);
      params.push(...(this._extra.params || []));
    }

    if (!whereParts.length) return { clause: "", params: [] };
    return { clause: " WHERE " + whereParts.join(" AND "), params };
  }

  _projectionSQL() {
    if (this._valuesFields && this._valuesFields.length) {
      return this._valuesFields.map(escapeIdentifier).join(", ");
    }

    // only/defer: compute which fields to select
    const allFields = Object.keys(this.model.fields || {});
    let pick = allFields;

    if (this._onlyFields) {
      pick = this._onlyFields;
    } else if (this._deferFields) {
      pick = allFields.filter(f => !this._deferFields.includes(f));
    }

    // If annotate present, include annotation expressions
    if (this._annotate) {
      const annoParts = Object.entries(this._annotate).map(([alias, desc]) => {
        const fn = (desc.fn || "COUNT").toUpperCase();
        const field = desc.field || "*";
        return `${fn}(${field}) AS ${escapeIdentifier(alias)}`;
      });
      const base = pick.length ? pick.map(escapeIdentifier).join(", ") : `${this.model.table}.*`;
      return [base, ...annoParts].join(", ");
    }

    return pick.length ? pick.map(escapeIdentifier).join(", ") : `${this.model.table}.*`;
  }

  _orderBySQL() {
    if (!this._orderBy) return "";
    const orderParts = Array.isArray(this._orderBy) ? this._orderBy : [this._orderBy];
    const compiled = orderParts.map(f => {
      const dir = f.startsWith("-") ? "DESC" : "ASC";
      const col = f.startsWith("-") ? f.slice(1) : f;
      return `${escapeIdentifier(col)} ${dir}`;
    });
    return ` ORDER BY ${compiled.join(", ")}`;
  }

  _limitOffsetSQL() {
    let s = "";
    if (this._limit != null) s += ` LIMIT ${Number(this._limit)}`;
    if (this._offset != null) s += ` OFFSET ${Number(this._offset)}`;
    return s;
  }

  async _executeSQL({ sql, params = [] }) {
    const db = await getDB();
    // choose proper runner
    if (/^\s*SELECT/i.test(sql)) {
      return await db.all(sql, params);
    } else {
      return await db.run(sql, params);
    }
  }

  // Core toSQL builder (does not handle compound ops)
  toSQL() {
    const table = this.model.table;
    if (!table) throw new Error(`${this.model.name} has no table defined`);

    const selectCols = this._projectionSQL();
    let sql = `SELECT ${this._distinct ? "DISTINCT " : ""}${selectCols} FROM ${table}`;

    const where = this._buildWhereClause();
    sql += where.clause;

    if (this._groupBy && this._groupBy.length) {
      sql += ` GROUP BY ${this._groupBy.map(escapeIdentifier).join(", ")}`;
    }

    sql += this._orderBySQL();
    sql += this._limitOffsetSQL();

    return { sql, params: where.params };
  }

  async _compoundSQL() {
    if (!this._compound) return this.toSQL();
    const left = this.toSQL();
    const right = this._compound.q.toSQL();
    const op = this._compound.type + (this._compound.all ? " ALL" : "");
    const sql = `(${left.sql}) ${op} (${right.sql})`;
    return { sql, params: [...left.params, ...right.params] };
  }

  // -------------------- CRUD & DML --------------------

  async create(data = {}) {
    const db = await getDB();
    const table = this.model.table;

    const cols = [];
    const placeholders = [];
    const values = [];

    for (const [name, field] of Object.entries(this.model.fields || {})) {
      if (field.primaryKey) continue; // skip PK (assume autoinc)
      let val = data[name];

      // auto fields handling (autoNowAdd/autoNow)
      if (field.autoNowAdd && val === undefined) val = new Date().toISOString();
      if (field.autoNow && val === undefined) val = new Date().toISOString();

      if (val === undefined && typeof field.default === "function") val = field.default();
      if (val === undefined && field.default !== undefined) val = field.default;

      if (typeof field.validate === "function") field.validate(val);

      cols.push(escapeIdentifier(name));
      placeholders.push("?");
      values.push(val === undefined ? null : val);
    }

    const sql = `INSERT INTO ${escapeIdentifier(table)} (${cols.join(",")}) VALUES (${placeholders.join(",")})`;
    const res = await db.run(sql, values);
    const lastId = res.lastID ?? res.id ?? null;
    if (lastId == null) return { id: null, ...data };
    return await this.model.objects.get({ id: lastId });
  }

  async bulkCreate(list = []) {
    if (!Array.isArray(list) || list.length === 0) return [];
    const created = [];
    for (const item of list) {
      created.push(await this.create(item));
    }
    return created;
  }

  async update(where = {}, data = {}) {
    // non-destructive update - uses explicit where or existing filters
    const db = await getDB();
    const table = escapeIdentifier(this.model.table);

    // inject autoNow
    for (const [name, field] of Object.entries(this.model.fields || {})) {
      if (field.autoNow) data[name] = new Date().toISOString();
    }

    const setParts = [];
    const setVals = [];
    for (const [k, v] of Object.entries(data)) {
      setParts.push(`${escapeIdentifier(k)} = ?`);
      setVals.push(v);
    }
    if (!setParts.length) return 0;

    const qs = this._clone();
    const whereObj = qs._buildWhereClauseFor(where);
    const sql = `UPDATE ${table} SET ${setParts.join(", ")}${whereObj.clause}`;
    const res = await db.run(sql, [...setVals, ...whereObj.params]);
    return res.changes ?? 0;
  }

  async bulkUpdate(list = [], fields = []) {
    if (!Array.isArray(list) || list.length === 0) return 0;
    if (!Array.isArray(fields) || fields.length === 0) throw new Error("fields array required for bulkUpdate");

    let changed = 0;
    for (const obj of list) {
      const pkName = Object.entries(this.model.fields).find(([, f]) => f.primaryKey)?.[0] ?? "id";
      const pkVal = obj[pkName];
      if (!pkVal) continue;
      const qs = this.model.objects.filter({ [pkName]: pkVal });
      const data = {};
      for (const fld of fields) {
        if (fld in obj) data[fld] = obj[fld];
      }
      changed += await qs.update({}, data);
    }
    return changed;
  }

  async updateOrCreate(lookup = {}, data = {}) {
    const existing = await this.filter(lookup).first();
    if (existing) {
      await this.filter(lookup).update(data);
      return [await this.filter(lookup).get(), false];
    }
    const created = await this.create({ ...lookup, ...data });
    return [created, true];
  }

  async getOrCreate(lookup = {}, defaults = {}) {
    const existing = await this.filter(lookup).first();
    if (existing) return [existing, false];
    const created = await this.create({ ...lookup, ...defaults });
    return [created, true];
  }

  async delete(where = {}) {
    const db = await getDB();
    const table = escapeIdentifier(this.model.table);
    const whereObj = this._buildWhereClauseFor(where);
    if (!whereObj.clause) throw new Error("Refusing to delete without where clause");
    const res = await db.run(`DELETE FROM ${table}${whereObj.clause}`, whereObj.params);
    return res.changes ?? 0;
  }

  // -------------------- Chainable builders --------------------

  filter(where = {}) {
    const clone = this._clone();
    clone._filters = { ...clone._filters, ...where };
    return clone;
  }

  exclude(where = {}) {
    const clone = this._clone();
    clone._exclude = { ...clone._exclude, ...where };
    return clone;
  }

  orderBy(...fields) {
    const clone = this._clone();
    clone._orderBy = fields.length === 1 ? fields[0] : fields;
    return clone;
  }

  order_by(...f) { return this.orderBy(...f); }

  limit(n) {
    const clone = this._clone();
    clone._limit = n == null ? null : Number(n);
    return clone;
  }

  offset(n) {
    const clone = this._clone();
    clone._offset = n == null ? null : Number(n);
    return clone;
  }

  distinct(flag = true) {
    const clone = this._clone();
    clone._distinct = !!flag;
    return clone;
  }

  values(...cols) {
    const clone = this._clone();
    clone._valuesFields = cols.length ? cols : [];
    clone._valuesList = false;
    return clone;
  }

  values_list(...cols) {
    const clone = this._clone();
    clone._valuesFields = cols.length ? cols : [];
    clone._valuesList = true;
    return clone;
  }

  only(...cols) {
    const clone = this._clone();
    clone._onlyFields = cols.length ? cols : null;
    return clone;
  }

  defer(...cols) {
    const clone = this._clone();
    clone._deferFields = cols.length ? cols : null;
    return clone;
  }

  annotate(annoObj = {}) {
    const clone = this._clone();
    clone._annotate = { ...(clone._annotate || {}), ...annoObj };
    return clone;
  }

  groupBy(...cols) {
    const clone = this._clone();
    clone._groupBy = cols.length ? cols : null;
    return clone;
  }

  union(otherQ, all = false) {
    const clone = this._clone();
    clone._compound = { type: "UNION", qs: otherQ, all };
    return clone;
  }

  intersect(otherQ, all = false) {
    const clone = this._clone();
    clone._compound = { type: "INTERSECT", qs: otherQ, all };
    return clone;
  }

  except(otherQ, all = false) {
    const clone = this._clone();
    clone._compound = { type: "EXCEPT", qs: otherQ, all };
    return clone;
  }

  alias(aliasMap = {}) {
    const clone = this._clone();
    clone._alias = { ...(clone._alias || {}), ...aliasMap };
    return clone;
  }

  extra({ select = [], where = [], params = [] } = {}) {
    const clone = this._clone();
    clone._extra = clone._extra || { select: [], where: [], params: [] };
    clone._extra.select.push(...select);
    clone._extra.where.push(...where);
    clone._extra.params.push(...params);
    return clone;
  }

  select_related(...rels) {
    const clone = this._clone();
    clone._selectRelated = clone._selectRelated ? [...clone._selectRelated, ...rels] : [...rels];
    return clone;
  }

  prefetch_related(...rels) {
    const clone = this._clone();
    clone._prefetchRelated = clone._prefetchRelated ? [...clone._prefetchRelated, ...rels] : [...rels];
    return clone;
  }

  none() {
    const clone = this._clone();
    clone._filters = { __none__: [] }; // impossible filter
    return clone;
  }

  reverse() {
    const clone = this._clone();
    if (!clone._orderBy) return clone;
    const rev = Array.isArray(clone._orderBy)
      ? clone._orderBy.map(f => (f.startsWith("-") ? f.slice(1) : "-" + f))
      : (clone._orderBy.startsWith("-") ? clone._orderBy.slice(1) : "-" + clone._orderBy);
    clone._orderBy = rev;
    return clone;
  }

  // -------------------- Execution & retrieval --------------------

  // internal helper to build where clause for ad-hoc where objects
  _buildWhereClauseFor(where = {}) {
    // if where provided use it merged with existing filters
    if (!isObjEmpty(where)) {
      const tmp = new QuerySet(this.model);
      tmp._filters = { ...(this._filters || {}), ...where };
      tmp._exclude = { ...(this._exclude || {}) };
      return tmp._buildWhereClause();
    }
    return this._buildWhereClause();
  }

  async all() {
    // compound handling
    const sqlObj = this._compound ? await this._compoundSQL() : this.toSQL();
    const db = await getDB();
    const rows = await db.all(sqlObj.sql, sqlObj.params);

    // values projection
    if (this._valuesFields && this._valuesFields.length) {
      if (this._valuesList) {
        return rows.map(r => this._valuesFields.map(f => r[f]));
      }
      return rows;
    }

    if (this._onlyRaw) return rows;

    // map to model instances
    return rows.map(row => new this.model(row));
  }

  async get(where = {}) {
    const q = this.filter(where).limit(2);
    const rows = await q.all();
    if (!rows || rows.length === 0) return null;
    if (rows.length > 1) throw new Error(`${this.model.name} returned multiple objects`);
    return rows[0];
  }

  async first() {
    const q = this._clone();
    q._limit = 1;
    const rows = await q.all();
    return rows.length ? rows[0] : null;
  }

  async last() {
    const q = this._clone();
    if (q._orderBy) {
      // reverse ordering
      q._orderBy = Array.isArray(q._orderBy)
        ? q._orderBy.map(f => (f.startsWith("-") ? f.slice(1) : "-" + f))
        : (q._orderBy.startsWith("-") ? q._orderBy.slice(1) : "-" + q._orderBy);
    } else {
      const pk = Object.entries(this.model.fields).find(([, fld]) => fld.primaryKey)?.[0] || "id";
      q._orderBy = "-" + pk;
    }
    q._limit = 1;
    const rows = await q.all();
    return rows.length ? rows[0] : null;
  }

  async exists() {
    const db = await getDB();
    const table = escapeIdentifier(this.model.table);
    const where = this._buildWhereClause();
    const sql = `SELECT 1 FROM ${table}${where.clause} LIMIT 1`;
    const r = await db.get(sql, where.params);
    return !!r;
  }

  async count() {
    const db = await getDB();
    const table = escapeIdentifier(this.model.table);
    const where = this._buildWhereClause();
    const sql = `SELECT COUNT(*) as count FROM ${table}${where.clause}`;
    const r = await db.get(sql, where.params);
    return (r && (r.count ?? r["COUNT(*)"])) || 0;
  }

  async in_bulk(field = "id") {
    const rows = await this.all();
    const map = {};
    for (const r of rows) {
      map[r[field]] = r;
    }
    return map;
  }

  async values_list_flat(...cols) {
    const q = this.values_list(...cols);
    const rows = await q.all();
    if (!cols.length) return rows.map(r => Object.values(r)[0]);
    return rows.map(r => r[0]);
  }

  async *iterator(batchSize = 100) {
  // async generator — allows "for await...of"
  const q = this._clone();
  let offset = q._offset || 0;

  while (true) {
    q._limit = batchSize;
    q._offset = offset;
    const rows = await q.all();

    if (!rows || rows.length === 0) break;

    for (const r of rows) {
      yield r; // ✅ now valid
    }

    offset += rows.length;
    if (rows.length < batchSize) break;
  }
}

  async aggregate(aggObj = {}) {
    if (isObjEmpty(aggObj)) return {};
    const db = await getDB();
    const table = escapeIdentifier(this.model.table);
    const parts = [];
    const params = [];

    for (const [alias, desc] of Object.entries(aggObj)) {
      const fn = (desc.fn || "COUNT").toUpperCase();
      const field = desc.field || "*";
      parts.push(`${fn}(${field}) AS ${escapeIdentifier(alias)}`);
    }

    const where = this._buildWhereClause();
    const sql = `SELECT ${parts.join(", ")} FROM ${table}${where.clause}`;
    const row = await db.get(sql, where.params);
    return row || {};
  }

  // simple annotate (non-ORM expression engine)
  async annotateExec(annoObj = {}) {
    const q = this.annotate(annoObj);
    return q.all();
  }

  async explain(verbose = false) {
    const sqlObj = this.toSQL();
    const db = await getDB();
    const rows = await db.all(`EXPLAIN QUERY PLAN ${sqlObj.sql}`, sqlObj.params);
    if (verbose) console.log(rows);
    return rows;
  }

  // earliest/latest helpers
  async earliest(field) {
    const f = field || Object.entries(this.model.fields).find(([, fld]) => fld.primaryKey)?.[0] || "id";
    const q = this.orderBy(f).limit(1);
    const rows = await q.all();
    return rows.length ? rows[0] : null;
  }

  async latest(field) {
    const f = field || Object.entries(this.model.fields).find(([, fld]) => fld.primaryKey)?.[0] || "id";
    const q = this.orderBy("-" + f).limit(1);
    const rows = await q.all();
    return rows.length ? rows[0] : null;
  }

  // -------------------- Helper: build where for ad-hoc usage --------------------
  // public wrapper used by update/delete convenience code above
  _buildWhereClauseFor(where = {}) {
    if (isObjEmpty(where)) return this._buildWhereClause();
    // merge where with existing filters
    const clone = this._clone();
    clone._filters = { ...clone._filters, ...where };
    return clone._buildWhereClause();
  }
}
