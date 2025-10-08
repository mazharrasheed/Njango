import { QuerySet } from "./queryset.js";

export class Manager {
  constructor(model) {
    this.model = model;
  }

  get queryset() {
    return new QuerySet(this.model);
  }

  all() {
    return this.queryset.all();
  }

  filter(where) {
    return this.queryset.filter(where);
  }

  get(where) {
    return this.queryset.get(where);
  }

  create(data) {
    return this.queryset.create(data);
  }

  update(where, data) {
    return this.queryset.update(where, data);
  }

  delete(where) {
    return this.queryset.delete(where);
  }
}
