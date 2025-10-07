import * as fields from "../../core/orm/fields.js";
import { Model } from "../../core/orm/models.js";

export class User extends Model {
    static table = "users";   // ✅ use `table` instead of `tableName`
    static fields = {
        id: new fields.IntegerField({ primaryKey: true }),
        username: new fields.CharField({ max_length: 50, unique: true }),
        firstname: new fields.CharField({null:true}),
        lastname: new fields.CharField({null:true}),
        role: new fields.CharField({default:'user'}),
        permissions: new fields.CharField({default:'[]'}),
        password: new fields.CharField(),
        email: new fields.EmailField({null:true}),
        is_active: new fields.BooleanField({ default: true }),
        is_superuser: new fields.BooleanField({ default: false }),
        created_at: new fields.DateTimeField({ autoNowAdd: true }),
        updated_at: new fields.DateTimeField({ autoNow: true }),
    };
}

await User.init();