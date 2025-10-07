

// blog/urls.js
import { blogIndex, blogPost,addBlogPost } from "./views.js";

export const blogUrls = [
  { method: "get", path: "/blog", view: blogIndex, name: "blogIndex" },
  { method: "get", path: "/blog/:id", view: blogPost, name: "blogPost" },
  { method: "post", path: "/addblog", view: addBlogPost, name: "addblogPost"},
];
