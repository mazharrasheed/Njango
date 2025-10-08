// import { runQuery, runExecute } from "../../core/db.js";

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
    await Blog.objects.create({title:title,body:content,author:1})
    res.json({ message: "Post created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }

}