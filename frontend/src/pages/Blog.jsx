import { useState, useEffect } from "react";
import api from "../api";

export default function Blog() {
    const [posts, setPosts] = useState([]);
    const [form, setForm] = useState({ title: "", content: "" });
    const [editId, setEditId] = useState(null);
    // Current 
    const user=localStorage.getItem('user');
    console.log("Current User:", user);

    // Fetch all posts
    const fetchPosts = async () => {
        try {
            const res = await api.get("/blog");
            setPosts(res.data);
            console.log("response data from blogs",res.data)
        } catch (err) {
            console.error(err);
            alert("Failed to load posts");
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) {
            alert("You must be logged in");
            return;
        }

        try {
            if (editId) {
                await api.put(`/posts/${editId}`, form, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                alert("Post updated");
            } else {
                await api.post("/addblog", form, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                alert("Post created");
            }

            setForm({ title: "", body: "" });
            setEditId(null);
            fetchPosts();
        } catch (err) {
            console.error(err);
            alert("Failed to save post");
        }
    };

    const addBlog = () => {
        document.getElementById('add-blog').style.display = 'block';
    }
    const cancelBlog = () => {
        document.getElementById('add-blog').style.display = 'none';
    }


        return (
            <div className="container mt-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3>Posts</h3> <button className="btn btn-success" onClick={addBlog}> <i className="bi bi-plus-lg me-1"></i>  Add Blog</button>
                </div>
                <form id='add-blog' style={{display:'none'}} onSubmit={handleSubmit} className="mb-4 mt-3">
                    <input
                        className="form-control mt-2"
                        name="title"
                        placeholder="Title"
                        value={form.title}
                        onChange={handleChange}
                        required
                    />
                    <textarea
                        className="form-control mt-2"
                        name="content"
                        placeholder="Content"
                        value={form.body}
                        onChange={handleChange}
                        required
                    />
                    <button className="btn btn-primary mt-2" type="submit">
                        <i className="bi bi-plus-lg me-1"></i>
                        {editId ? "Update Post" : "Create Post"}
                    </button>
                    <button className="btn btn-primary mt-2 ms-2" onClick={cancelBlog}>
                        <i className="bi bi-x-lg me-1"></i>
                        Cancel
                    </button>
                    
                    
                </form>
                <div className="container mt-5">
                    <div className="row g-3">
                        {posts.map((post,index) => (
                            <div key={index} className="col-md-3">
                                <div className="card h-100">
                                    <div className="card-body">
                                        <h5 className="card-title">{post.title}</h5>
                                        <p className="card-text">{post.body}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
