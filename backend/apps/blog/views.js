import { runQuery, runExecute } from "../core/db.js";

// blog/views.js

export function blogIndex(req, res) {
  try {
    const posts = runQuery("SELECT * FROM posts ");
    if (posts) { res.json(posts) }
    else {
      res.json({ 'post': 'maypost' })
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
    runExecute("INSERT INTO posts (title, content) VALUES (?, ?)", [title, content]);
    res.json({ message: "Post created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }

}