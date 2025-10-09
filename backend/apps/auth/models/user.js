
import { Model } from "../../../core/orm/models.js";
import { registerReverseRelations } from "../../../core/orm/relations.js";

export class User extends Model {
    static table = "users";   // ✅ use `table` instead of `tableName`
    static fields = {
        id: User.fields.IntegerField({ primaryKey: true }),
        username: User.fields.CharField({ max_length: 50, unique: true }),
        firstname: User.fields.CharField({null:true}),
        lastname: User.fields.CharField({null:true}),
        role: User.fields.CharField({default:'user'}),
        permissions: User.fields.CharField({default:'[]'}),
        password: User.fields.CharField(),
        email: User.fields.EmailField({null:true}),
        is_active: User.fields.BooleanField({ default: true }),
        is_superuser: User.fields.BooleanField({ default: false }),
        created_at:User.fields.DateTimeField({ autoNowAdd: true }),
        updated_at: User.fields.DateTimeField({ autoNow: true }),
    };

    has_perm(perm) {
        console.log('Checking permission:', perm);
        console.log('User permissions:', this.permissions);
    return this.permissions.includes(perm);
  }

  constructor(data = {}) {
    super();
    Object.assign(this, data);
  }
}
await User.init();