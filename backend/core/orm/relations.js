// core/orm/relations.js
import { ForeignKey, ManyToManyField, OneToOneField } from "./fields.js";

/**
 * Registers reverse relationships between models
 */
export function registerReverseRelations(models) {
  console.log("Registering reverse relations for models:", models.map(m => m.name));

  for (const model of models) {
    for (const [fieldName, field] of Object.entries(model.fields)) {
      // One-to-Many (ForeignKey)
      if (field instanceof ForeignKey) {
        const relatedModel = field.to;
        const relatedName = field.related_name || `${model.table}_set`;

        if (!relatedModel.prototype.hasOwnProperty(relatedName)) {
          Object.defineProperty(relatedModel.prototype, relatedName, {
            get() {
              return model.objects.filter({ [fieldName]: this.id });
            },
          });
        }
      }

      // ✅ Many-to-Many
      if (field instanceof ManyToManyField) {
        const relatedModel = field.to;
        const throughTable = field.through ?? `${model.table}_${relatedModel.table}`;
        const relatedName = field.related_name || `${model.table}_set`;

        // Forward relation
        Object.defineProperty(model.prototype, fieldName, {
          get() {
            return {
              async all() {
                const db = await import("./db.js").then(m => m.getDB());
                const query = `
                  SELECT ${relatedModel.table}.*
                  FROM ${relatedModel.table}
                  JOIN ${throughTable} 
                  ON ${relatedModel.table}.id = ${throughTable}.${relatedModel.table}_id
                  WHERE ${throughTable}.${model.table}_id = ?
                `;
                const rows = await (await db.getDB()).all(query, [this.id]);
                return rows.map(r => new relatedModel(r));
              },
            };
          },
        });

        // Reverse relation
        if (!relatedModel.prototype.hasOwnProperty(relatedName)) {
          Object.defineProperty(relatedModel.prototype, relatedName, {
            get() {
              return {
                async all() {
                  const db = await import("./db.js").then(m => m.getDB());
                  const query = `
                    SELECT ${model.table}.*
                    FROM ${model.table}
                    JOIN ${throughTable} 
                    ON ${model.table}.id = ${throughTable}.${model.table}_id
                    WHERE ${throughTable}.${relatedModel.table}_id = ?
                  `;
                  const rows = await (await db.getDB()).all(query, [this.id]);
                  return rows.map(r => new model(r));
                },
              };
            },
          });
        }
      }
    }
  }
}
