import { User } from "./auth/models/user.js";
import { Blog } from "./blog/models/blog.js";

const user = await User.objects.create({ username: "mazhar", email: "m@x.com" ,password:'123456' ,is_active:1});
const getuser= await User.objects.get({id:1})

const filterusers = await User.objects.filter({ id: 1  }).all();

await Blog.objects.create({ title: "My Blog", body: "Hello ORM", author: getuser.id });

// Update user with id=1
// await User.objects.update({ id: 1 }, { username: "mazhar_new", is_active: false });

// Update all inactive users
// await User.objects.update({ is_active: false }, { is_active: true });

// Update blog title where author=1
// await Blog.objects.update({ id: 2 }, { title: " My Blog" });
// await Blog.objects.delete({ id: 5 });


console.log(await Blog.objects.all());
console.log(filterusers);