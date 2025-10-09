// core/fields.js
// Comprehensive Django-like field definitions for a JS ORM.
// Supports SQLite and Postgres (client-aware SQL generation).
import { randomUUID } from "crypto";

function escapeSqlString(v) {
  return String(v).replace(/'/g, "''");
}

export class Field {
  constructor(options = {}) {
    this.default = options.default;
    this.null = options.null ?? false;
    this.unique = options.unique ?? false;
    this.primaryKey = options.primaryKey ?? false;
    this.db_index = options.db_index ?? false;
    this.choices = options.choices ?? null; // array of allowed values
    this.editable = options.editable ?? true;
    this.help_text = options.help_text ?? "";
  }

  // Returns SQL fragment for DEFAULT (if value is static)
  defaultSQL(client = "sqlite") {
    if (this.default === undefined || this.default === null) return "";
    // functions cannot be serialized into SQL default — skip those
    if (typeof this.default === "function") return "";
    if (typeof this.default === "string") return ` DEFAULT '${escapeSqlString(this.default)}'`;
    if (typeof this.default === "boolean") return ` DEFAULT ${this.default ? 1 : 0}`;
    // numbers and objects handled simply
    return ` DEFAULT ${JSON.stringify(this.default)}`;
  }

  baseSQL(type, client = "sqlite") {
    let sql = type;
    if (this.primaryKey) {
      // primary key specifics handled in subclass for serial/autoinc
      if (client === "pg") {
        sql += " PRIMARY KEY";
      } else {
        sql += " PRIMARY KEY";
      }
      // Do not add NOT NULL after primary key
    } else {
      if (!this.null) sql += " NOT NULL";
    }
    if (this.unique) sql += " UNIQUE";
    sql += this.defaultSQL(client);
    return sql;
  }

  // Validation hook called by higher-level ORM before insert/update
  validate(value) {
    if (value == null) {
      if (!this.null && !this.primaryKey && this.default === undefined) {
        throw new Error("This field does not allow null values");
      }
      return true;
    }
    if (this.choices && !this.choices.includes(value)) {
      throw new Error(`Value '${value}' not in choices: ${JSON.stringify(this.choices)}`);
    }
    return true;
  }

  // Subclasses must implement:
  toSQL(client = "sqlite") {
    throw new Error("Subclasses must implement toSQL()");
  }
}

/* ---------- Auto / Int types ---------- */

export class AutoField extends Field {
  toSQL(client = "sqlite") {
    return client === "pg" ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT";
  }
}

export class BigAutoField extends Field {
  toSQL(client = "sqlite") {
    return client === "pg" ? "BIGSERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT";
  }
}

export class IntegerField extends Field {
  toSQL(client = "sqlite") {
    return this.baseSQL("INTEGER", client);
  }
}

export class SmallIntegerField extends IntegerField {
  toSQL(client = "sqlite") {
    return this.baseSQL("SMALLINT", client);
  }
}

export class BigIntegerField extends IntegerField {
  toSQL(client = "sqlite") {
    return this.baseSQL("BIGINT", client);
  }
}

export class PositiveIntegerField extends IntegerField {
  toSQL(client = "sqlite") {
    return this.baseSQL("INTEGER", client); // no signed enforcement at DB level here
  }
}

export class PositiveSmallIntegerField extends SmallIntegerField {
  toSQL(client = "sqlite") {
    return this.baseSQL("SMALLINT", client);
  }
}

/* ---------- Numeric ---------- */

export class FloatField extends Field {
  toSQL(client = "sqlite") {
    return this.baseSQL("REAL", client);
  }
}

export class DecimalField extends Field {
  constructor(options = {}) {
    super(options);
    this.max_digits = options.max_digits ?? 10;
    this.decimal_places = options.decimal_places ?? 2;
  }
  toSQL(client = "sqlite") {
    if (client === "pg") {
      return this.baseSQL(`NUMERIC(${this.max_digits}, ${this.decimal_places})`, client);
    }
    return this.baseSQL("REAL", client);
  }
}

/* ---------- String / text ---------- */

export class CharField extends Field {
  constructor(options = {}) {
    super(options);
    this.max_length = options.max_length ?? 255;
  }
  toSQL(client = "sqlite") {
    // For Postgres prefer VARCHAR(n); for sqlite use TEXT
    const type = client === "pg" ? `VARCHAR(${this.max_length})` : "TEXT";
    return this.baseSQL(type, client);
  }
}

export class TextField extends Field {
  toSQL(client = "sqlite") {
    return this.baseSQL("TEXT", client);
  }
}

export class EmailField extends CharField {
  toSQL(client = "sqlite") {
    return super.toSQL(client);
  }
}

export class URLField extends CharField {
  toSQL(client = "sqlite") {
    return super.toSQL(client);
  }
}

export class SlugField extends CharField {
  constructor(options = {}) {
    super(options);
    this.allow_unicode = options.allow_unicode ?? false;
  }
  toSQL(client = "sqlite") {
    return super.toSQL(client);
  }
}

export class UUIDField extends Field {
  constructor(options = {}) {
    super(options);
  }
  toSQL(client = "sqlite") {
    return this.baseSQL("TEXT", client);
  }
  // helper to get default uuid when default is function
  static newUUID() {
    try {
      return randomUUID();
    } catch {
      return (Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
    }
  }
}

/* ---------- Boolean ---------- */

export class BooleanField extends Field {
  constructor(options = {}) {
    super(options);
  }
  toSQL(client = "sqlite") {
    // store booleans as integer 0/1 (consistent across sqlite)
    return this.baseSQL("INTEGER", client);
  }
}

/* ---------- Date/Time ---------- */

export class DateField extends Field {
  toSQL(client = "sqlite") {
    return this.baseSQL("TEXT", client); // ISO date string
  }
}

export class TimeField extends Field {
  toSQL(client = "sqlite") {
    return this.baseSQL("TEXT", client); // ISO time string
  }
}

export class DateTimeField {
  constructor(options = {}) {
    this.autoNow = options.autoNow || false;       // updates on every save/update
    this.autoNowAdd = options.autoNowAdd || false; // sets only when created
    this.null = options.null || false;
    this.defaultValue = options.defaultValue ?? null;
  }

  toSQL() {
    // SQLite stores ISO text as default, but you can switch to DATETIME if desired
    return `TEXT${this.null ? "" : " NOT NULL"}`;
  }

  getDefault() {
    if (this.autoNow || this.autoNowAdd) {
      return new Date().toISOString();
    }
    return this.defaultValue;
  }

  validate(value) {
    if (!this.null && value == null) {
      throw new Error(`DateTimeField cannot be null`);
    }
  }
}


/* ---------- Duration / Binary / JSON ---------- */

export class DurationField extends Field {
  constructor(options = {}) { super(options); }
  toSQL(client = "sqlite") {
    // store seconds as INTEGER
    return this.baseSQL("INTEGER", client);
  }
}

export class BinaryField extends Field {
  toSQL(client = "sqlite") {
    return this.baseSQL(client === "pg" ? "BYTEA" : "BLOB", client);
  }
}

export class JSONField extends Field {
  toSQL(client = "sqlite") {
    return this.baseSQL(client === "pg" ? "JSONB" : "TEXT", client);
  }
}

/* ---------- File/Image placeholders ---------- */

export class FileField extends Field {
  constructor(options = {}) {
    super(options);
    this.upload_to = options.upload_to || null; // path template (not enforced here)
  }
  toSQL(client = "sqlite") {
    return this.baseSQL("TEXT", client); // store path
  }
}

export class ImageField extends FileField {
  toSQL(client = "sqlite") {
    return super.toSQL(client);
  }
}

/* ---------- Relational fields ---------- */

export class ForeignKey extends Field {
  constructor(toModel, options = {}) {
    super(options);
    this.to = toModel;
    this.related_name = options.related_name ?? null;
    this.on_delete = (options.on_delete || "CASCADE").toUpperCase();
  }

  toSQL(fieldName) {
    // Get referenced model table name
    const refTable = this.to.table;
    const refField = "id"; // default primary key

    // Example: author_id INTEGER REFERENCES users(id) ON DELETE CASCADE
    return `${fieldName}_id INTEGER REFERENCES ${refTable}(${refField}) ON DELETE ${this.on_delete}`;
  }
}

export class OneToOneField extends ForeignKey {
  constructor(toModel, options = {}) {
    super(toModel, { ...options, unique: true });
  }
}

export class ManyToManyField extends Field {
  constructor(toModel, options = {}) {
    super(options);
    this.to = toModel;
    this.related_name = options.related_name ?? null;
    this.through = options.through ?? null; // custom join table if provided
  }
  toSQL() {
    // no column on model table; migration system should create join table
    return null;
  }

  // helper to compute default through table name
  getThroughName(fromModel, toModel) {
    if (this.through) return this.through;
    const a = typeof fromModel === "string" ? fromModel : fromModel.table;
    const b = typeof toModel === "string" ? toModel : toModel.table;
    return `${a}_${b}_m2m`;
  }
}

/* ---------- Export helpers ---------- */

export const fields = {
  Field,
  AutoField: (opts = {}) => new AutoField(opts),
  BigAutoField: (opts = {}) => new BigAutoField(opts),
  IntegerField: (opts = {}) => new IntegerField(opts),
  SmallIntegerField: (opts = {}) => new SmallIntegerField(opts),
  BigIntegerField: (opts = {}) => new BigIntegerField(opts),
  PositiveIntegerField: (opts = {}) => new PositiveIntegerField(opts),
  PositiveSmallIntegerField: (opts = {}) => new PositiveSmallIntegerField(opts),
  FloatField: (opts = {}) => new FloatField(opts),
  DecimalField: (opts = {}) => new DecimalField(opts),
  CharField: (opts = {}) => new CharField(opts),
  TextField: (opts = {}) => new TextField(opts),
  EmailField: (opts = {}) => new EmailField(opts),
  URLField: (opts = {}) => new URLField(opts),
  SlugField: (opts = {}) => new SlugField(opts),
  UUIDField: (opts = {}) => new UUIDField(opts),
  BooleanField: (opts = {}) => new BooleanField(opts),
  DateField: (opts = {}) => new DateField(opts),
  TimeField: (opts = {}) => new TimeField(opts),
  DateTimeField: (opts = {}) => new DateTimeField(opts),
  DurationField: (opts = {}) => new DurationField(opts),
  BinaryField: (opts = {}) => new BinaryField(opts),
  JSONField: (opts = {}) => new JSONField(opts),
  FileField: (opts = {}) => new FileField(opts),
  ImageField: (opts = {}) => new ImageField(opts),
  ForeignKey: (to, opts = {}) => new ForeignKey(to, opts),
  OneToOneField: (to, opts = {}) => new OneToOneField(to, opts),
  ManyToManyField: (to, opts = {}) => new ManyToManyField(to, opts),
};
