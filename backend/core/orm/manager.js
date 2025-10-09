import { QuerySet } from "./queryset.js";

export class Manager {
  constructor(model) {
    this.model = model;
  }

  // always get fresh queryset
  get queryset() {
    return new QuerySet(this.model);
  }

  /* -------------------- CRUD -------------------- */
  async create(data) {
    return this.queryset.create(data);
  }

  async bulkCreate(list) {
    return this.queryset.bulkCreate(list);
  }

  async update(where, data) {
    return this.queryset.update(where, data);
  }

  async updateOrCreate(lookup, data) {
    return this.queryset.updateOrCreate(lookup, data);
  }

  async getOrCreate(lookup, defaults) {
    return this.queryset.getOrCreate(lookup, defaults);
  }

  async delete(where) {
    return this.queryset.delete(where);
  }

  /* -------------------- RETRIEVAL -------------------- */
  all() {
    return this.queryset.all();
  }

  filter(where) {
    return this.queryset.filter(where);
  }

  exclude(where) {
    return this.queryset.exclude(where);
  }

  orderBy(...fields) {
    return this.queryset.orderBy(...fields);
  }

  order_by(...fields) {
    return this.queryset.order_by(...fields);
  }

  limit(n) {
    return this.queryset.limit(n);
  }

  offset(n) {
    return this.queryset.offset(n);
  }

  distinct(flag = true) {
    return this.queryset.distinct(flag);
  }

  values(...cols) {
    return this.queryset.values(...cols);
  }

  values_list(...cols) {
    return this.queryset.values_list(...cols);
  }

  groupBy(...cols) {
    return this.queryset.groupBy(...cols);
  }

  annotate(obj) {
    return this.queryset.annotate(obj);
  }

  union(otherQ, all = false) {
    return this.queryset.union(otherQ, all);
  }

  intersect(otherQ, all = false) {
    return this.queryset.intersect(otherQ, all);
  }

  except(otherQ, all = false) {
    return this.queryset.except(otherQ, all);
  }

  /* -------------------- ACTION METHODS -------------------- */
  async get(where) {
    return this.queryset.get(where);
  }

  async first() {
    return this.queryset.first();
  }

  async last() {
    return this.queryset.last();
  }

  async exists() {
    return this.queryset.exists();
  }

  async count() {
    return this.queryset.count();
  }

  async aggregate(obj) {
    return this.queryset.aggregate(obj);
  }

  /* -------------------- ITERATION -------------------- */
  iterator(batchSize = 100) {
    return this.queryset.iterator(batchSize);
  }

  /* -------------------- UTILITY -------------------- */
  toSQL() {
    return this.queryset.toSQL();
  }

  _buildWhereClause(filters) {
    return this.queryset._buildWhereClause(filters);
  }
}
