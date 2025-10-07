import { getDB } from "./db.js";

export class QuerySet {
    constructor(model, filters = {}) {
        this.model = model;
        this._filters = { ...filters }; // copy current filters
    }

    /* --- Returns a new QuerySet with merged filters --- */
    filter(where = {}) {
        // merge filters, return a new queryset
        const clone = new QuerySet(this.model);
        clone._filters = { ...this._filters, ...where };
        return clone;
    }


    /* --- Fetch all records (applying filters if any) --- */
    async all() {
        const db = await getDB();
        const table = this.model.table;
        if (!table) throw new Error(`${this.model.name} has no table defined`);

        let sql = `SELECT * FROM ${table}`;
        const values = [];

        if (Object.keys(this._filters).length > 0) {
            const whereClause = Object.keys(this._filters)
                .map(k => `${k} = ?`)
                .join(" AND ");
            sql += ` WHERE ${whereClause}`;
            values.push(...Object.values(this._filters));
        }

        const rows = await db.all(sql, values);
        return rows;
    }

    async get(where = {}) {
        const rows = await this.filter(where).all();

        if (rows.length === 0) {
            return null; // or return false;
        }

        if (rows.length > 1) {
            throw new Error(`${this.model.name} returned multiple objects`);
        }

        return rows[0];
    }

    async create(data = {}) {
        const db = await getDB();
        const table = this.model.table;

        const cols = [];
        const vals = [];
        const placeholders = [];

        for (const [name, field] of Object.entries(this.model.fields)) {
            if (name === "id" && field.primaryKey) continue;

            let value = data[name];

            // Auto timestamps
            if (field.autoNowAdd && value === undefined) {
                value = field.getDefault();
            } else if (field.autoNow && value === undefined) {
                value = field.getDefault();
            }

            // Default values
            if (value === undefined && typeof field.default === "function") value = field.default();
            if (value === undefined && field.default !== undefined) value = field.default;

            field.validate(value);
            cols.push(name);
            vals.push(value);
            placeholders.push("?");
        }

        const sql = `INSERT INTO ${table} (${cols.join(",")}) VALUES (${placeholders.join(",")})`;
        const result = await db.run(sql, vals);
        return { id: result.lastID, ...data };
    }

    async update(where = {}, data = {}) {
        const db = await getDB();
        const table = this.model.table;

        const updates = {};
        for (const [name, field] of Object.entries(this.model.fields)) {
            if (field.autoNow) {
                updates[name] = field.getDefault(); // auto-update timestamp
            }
        }

        Object.assign(updates, data);

        const setCols = Object.keys(updates).map(k => `${k} = ?`).join(", ");
        const setVals = Object.values(updates);

        const whereCols = Object.keys(where).map(k => `${k} = ?`).join(" AND ");
        const whereVals = Object.values(where);

        const sql = `UPDATE ${table} SET ${setCols} WHERE ${whereCols}`;
        await db.run(sql, [...setVals, ...whereVals]);
        return true;
    }


    async delete(where = {}) {
        const db = await getDB();
        const table = this.model.table;

        const whereCols = Object.keys(where).map(k => `${k} = ?`).join(" AND ");
        const whereVals = Object.values(where);

        const sql = `DELETE FROM ${table} WHERE ${whereCols}`;
        await db.run(sql, whereVals);
        return true;
    }
}
