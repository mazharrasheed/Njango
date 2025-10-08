
import { User } from "../auth/models/user.js";
import {Blog} from "./models/blog.js";


// blog/views.js

export async function blogIndex(req, res) {
  try {
    const posts= await Blog.objects.all()
    if (posts) { res.json(posts) }
    else {
      res.json([{ 'post': 'maypost' }])
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export function blogPost(req, res) {
  res.send(`Blog Post ID: ${req.params.id}`);
}
export async function addBlogPost(req, res) {
  const { title, content } = req.body;
  try {
  console.log('im callde')
    const author=req.user.id
    console.log('im callde',author)
    if (!author) {
      return res.status(400).json({ error: "Invalid author" });
    }
    await Blog.objects.create({title:title,body:content,author:author})
    res.json({ message: "Post created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }

}