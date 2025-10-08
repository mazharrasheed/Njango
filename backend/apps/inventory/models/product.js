import { Model } from "../../core/orm/models.js";
import * as fields from "../../core/orm/fields.js";


export class Product extends Model {
    static table = "products";   // ✅ use `table` instead of `tableName`
    static fields = {
        id: new fields.IntegerField({ primaryKey: true }),
        name: new fields.CharField({ max_length: 50, unique: true }),
        created_at: new fields.DateTimeField({ autoNowAdd: true }),
        updated_at: new fields.DateTimeField({ autoNow: true }),
    };
}

await Product.init();