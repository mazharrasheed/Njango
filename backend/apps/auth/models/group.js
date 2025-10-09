import { Model } from "../../../core/orm/models.js";
import { User } from "./user.js";

export class Group extends Model {
    static table = "groups";
    static fields = {
        id: Group.fields.AutoField(),
        name: Group.fields.CharField(),
        des: Group.fields.CharField(),
        users: Group.fields.ManyToManyField(User, { related_name: "groups" }),
    };

    constructor(data = {}) {
        super();
        Object.assign(this, data);
    }

}

Group.init();