import { Model } from "../../../core/orm/models.js";
import { fields } from "../../../core/orm/fields.js";
import { User } from "../../auth/models/user.js";
import { Product } from "./product.js";

export class Order extends Model {
  static table = "orders";

  static fields = {
    id: Order.fields.AutoField(),
    user: Order.fields.ForeignKey(User, { related_name: "orders", on_delete: "CASCADE" }),
    product: Order.fields.ForeignKey(Product, { related_name: "orders", on_delete: "CASCADE" }),
    quantity: Order.fields.IntegerField({ default: 1 }),
    amount: Order.fields.FloatField({ default: 0.0 }),
    status: Order.fields.CharField({ max_length: 20, default: "pending" }),
    created_at: Order.fields.DateTimeField({ autoNowAdd: true }),
    updated_at: Order.fields.DateTimeField({ autoNow: true }),
  };

  constructor(data = {}) {
    super();
    Object.assign(this, data);
  }
}
Order.init();