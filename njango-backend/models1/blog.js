import * as fields from "../core/orm/fieldsdj.js";
import { Model } from "../core/orm/models.js";
import { User } from "./user.js";

export class Blog extends Model {
    static table = "blogs";
    static fields = {
        id: new fields.IntegerField({ primaryKey: true }),
        title: new fields.CharField({ max_length: 200, }),
        body: new fields.TextField({null:true}),
        author: new fields.ForeignKey(User, { related_name: "blogs", on_delete: "CASCADE" }),
    };
}

await Blog.init();