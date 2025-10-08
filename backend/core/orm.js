import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  getRepository,
  Like,
  LessThan,
  MoreThan,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  In,
  IsNull,
  Between,
  Any,
  Raw
} from "typeorm";

// Field factory functions
export const fields = {
  CharField: (opts = {}) => ({ type: "varchar", default: "", ...opts }),
  TextField: (opts = {}) => ({ type: "text", default: "", ...opts }),
  IntegerField: (opts = {}) => ({ type: "int", default: 0, ...opts }),
  FloatField: (opts = {}) => ({ type: "float", default: 0.0, ...opts }),
  DoubleField: (opts = {}) => ({ type: "double", default: 0.0, ...opts }),
  DecimalField: (opts = {}) => ({ type: "decimal", default: 0, ...opts }),
  BooleanField: (opts = {}) => ({ type: "boolean", default: false, ...opts }),
  DateField: (opts = {}) => ({ type: "date", ...opts }),
  DateTimeField: (opts = {}) => ({ type: "datetime", default: () => "CURRENT_TIMESTAMP", ...opts }),
  TimeField: (opts = {}) => ({ type: "time", ...opts }),
  EnumField: (enumValues, opts = {}) => ({ type: "enum", enum: enumValues, ...opts }),
  JsonField: (opts = {}) => ({ type: "json", default: {}, ...opts }),
  SimpleArrayField: (opts = {}) => ({ type: "simple-array", default: "", ...opts }),
  SimpleJsonField: (opts = {}) => ({ type: "simple-json", default: {}, ...opts }),
  BinaryField: (opts = {}) => ({ type: "blob", ...opts }),
  UuidField: (opts = {}) => ({ type: "uuid", ...opts }),
  // Relations
  ForeignKey: (target, opts = {}) => ({ relation: "many-to-one", target, opts }),
  OneToOneField: (target, opts = {}) => ({ relation: "one-to-one", target, opts }),
  ManyToManyField: (target, opts = {}) => ({ relation: "many-to-many", target, opts }),
};

// Q object for advanced lookups
export class Q {
  constructor(query) {
    this.query = query;
  }
  static and(...conditions) {
    return { $and: conditions.map(q => q.query) };
  }
  static or(...conditions) {
    return { $or: conditions.map(q => q.query) };
  }
  static not(condition) {
    return { $not: condition.query };
  }
}

// Lookup parser for Django-style queries
function parseLookups(where) {
  const parsed = {};
  for (const key in where) {
    if (key.includes("__")) {
      const [field, lookup] = key.split("__");
      const value = where[key];
      switch (lookup) {
        case "contains":
          parsed[field] = Like(`%${value}%`);
          break;
        case "icontains":
          parsed[field] = Like(`%${value.toLowerCase()}%`);
          break;
        case "startswith":
          parsed[field] = Like(`${value}%`);
          break;
        case "istartswith":
          parsed[field] = Like(`${value.toLowerCase()}%`);
          break;
        case "endswith":
          parsed[field] = Like(`%${value}`);
          break;
        case "iendswith":
          parsed[field] = Like(`%${value.toLowerCase()}`);
          break;
        case "lt":
          parsed[field] = LessThan(value);
          break;
        case "lte":
          parsed[field] = LessThanOrEqual(value);
          break;
        case "gt":
          parsed[field] = MoreThan(value);
          break;
        case "gte":
          parsed[field] = MoreThanOrEqual(value);
          break;
        case "not":
          parsed[field] = Not(value);
          break;
        case "in":
          parsed[field] = In(value);
          break;
        case "isnull":
          parsed[field] = value ? IsNull() : Not(IsNull());
          break;
        case "between":
          parsed[field] = Between(value[0], value[1]);
          break;
        case "any":
          parsed[field] = Any(value);
          break;
        case "raw":
          parsed[field] = Raw(value);
          break;
        default:
          parsed[field] = value;
      }
    } else {
      parsed[key] = where[key];
    }
  }
  return parsed;
}

// Base Model class
export class Model {
  static fields = {};

  static asTypeOrmEntity() {
  const columns = {};
  const relations = [];

  for (const [name, opts] of Object.entries(this.fields)) {
    if (opts.relation) {
      relations.push({ name, config: opts });
    } else {
      columns[name] = Column(opts);
    }
  }

  const EntityClass = class {};
  Object.defineProperty(EntityClass, "name", { value: this.name });
  Entity(EntityClass.name)(EntityClass);
  PrimaryGeneratedColumn()(EntityClass.prototype, "id");

  // Regular columns
  for (const name of Object.keys(columns)) {
    columns[name](EntityClass.prototype, name);
  }

  // Relations
  for (const { name, config } of relations) {
    // Ensure the relation target is a proper TypeORM entity
    const targetEntity =
      typeof config.target.asTypeOrmEntity === "function"
        ? config.target.asTypeOrmEntity()
        : config.target;

    if (config.relation === "many-to-one") {
      ManyToOne(() => targetEntity, config.opts)(EntityClass.prototype, name);
      JoinColumn()(EntityClass.prototype, name);
    }
    if (config.relation === "one-to-one") {
      OneToOne(() => targetEntity, config.opts)(EntityClass.prototype, name);
      JoinColumn()(EntityClass.prototype, name);
    }
    if (config.relation === "many-to-many") {
      ManyToMany(() => targetEntity, config.opts)(EntityClass.prototype, name);
      JoinTable()(EntityClass.prototype, name);
    }
  }

  return EntityClass;
}

  static get objects() {
    const entity = this.asTypeOrmEntity();
    const repo = getRepository(entity);

    return {
      // Basic queries
      async all() { return await repo.find(); },
      async get(where) { return await repo.findOneBy(where); },
      async filter(where) {
        let query = where;
        if (where instanceof Q) query = where.query;
        query = parseLookups(query);
        return await repo.find({ where: query });
      },
      async find(options) { return await repo.find(options); },
      async findOne(options) { return await repo.findOne(options); },
      async findBy(where) { return await repo.findBy(where); },
      async findAndCount(options) { return await repo.findAndCount(options); },
      async findOneBy(where) { return await repo.findOneBy(where); },
      async findOneOrFail(options) { return await repo.findOneOrFail(options); },
      async findByIds(ids) { return await repo.findByIds(ids); },

      // Create/Update/Delete
      async create(data) { const obj = repo.create(data); return await repo.save(obj); },
      async save(obj) { return await repo.save(obj); },
      async remove(obj) { return await repo.remove(obj); },
      async insert(data) { return await repo.insert(data); },
      async update(idOrWhere, data) { return await repo.update(idOrWhere, data); },
      async delete(idOrWhere) { return await repo.delete(idOrWhere); },

      // Aggregates
      async count(where = {}) { return await repo.count({ where }); },
      async increment(where, field, value) { return await repo.increment(where, field, value); },
      async decrement(where, field, value) { return await repo.decrement(where, field, value); },

      // Advanced aggregates
      async min(field, where = {}) {
        const qb = repo.createQueryBuilder("obj");
        qb.select(`MIN(obj.${field})`, "min");
        if (Object.keys(where).length) qb.where(parseLookups(where));
        const result = await qb.getRawOne();
        return result ? result.min : null;
      },
      async max(field, where = {}) {
        const qb = repo.createQueryBuilder("obj");
        qb.select(`MAX(obj.${field})`, "max");
        if (Object.keys(where).length) qb.where(parseLookups(where));
        const result = await qb.getRawOne();
        return result ? result.max : null;
      },
      async avg(field, where = {}) {
        const qb = repo.createQueryBuilder("obj");
        qb.select(`AVG(obj.${field})`, "avg");
        if (Object.keys(where).length) qb.where(parseLookups(where));
        const result = await qb.getRawOne();
        return result ? result.avg : null;
      },
      async sum(field, where = {}) {
        const qb = repo.createQueryBuilder("obj");
        qb.select(`SUM(obj.${field})`, "sum");
        if (Object.keys(where).length) qb.where(parseLookups(where));
        const result = await qb.getRawOne();
        return result ? result.sum : null;
      },

      // Custom query builder
      queryBuilder(alias = "obj") { return repo.createQueryBuilder(alias); }
    };
  }
}