import * as fields from "../core/orm/fieldsdj.js";
import { Model } from "../core/orm/models.js";

export class User extends Model {
    static table = "users";   // ✅ use `table` instead of `tableName`
    static fields = {
        id: new fields.IntegerField({ primaryKey: true }),
        username: new fields.CharField({ max_length: 50, unique: true }),
        password: new fields.CharField(),
        email: new fields.EmailField(),
        is_active: new fields.BooleanField({ default: true }),
    };
}

await User.init();