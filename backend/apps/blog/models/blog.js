
import { Model } from "../../../core/orm/models.js";
import { User } from "../../auth/models/user.js";

export class Blog extends Model {
    static table = "posts";
    static fields = {
        id: Blog.fields.IntegerField({ primaryKey: true }),
        title: Blog.fields.CharField({ max_length: 200, }),
        body: Blog.fields.TextField({null:true}),
        author: Blog.fields.ForeignKey(User, { related_name: "blogs", on_delete: "CASCADE" }),
    };
}

await Blog.init();