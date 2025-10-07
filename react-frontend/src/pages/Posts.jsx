import { useState, useEffect } from "react";
import api from "../api";

export default function Posts() {
    const [posts, setPosts] = useState([]);
    const [form, setForm] = useState({ title: "", body: "" });
    const [editId, setEditId] = useState(null);
    // Current user state

    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem("token");
            if (token) {
                const res = await api.get("/auth/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCurrentUser(res.data); // res.data should have _id
            }
        };
        fetchUser();
    }, []);



    // Fetch all posts
    const fetchPosts = async () => {
        try {
            const res = await api.get("/posts/mine");
            setPosts(res.data);
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
                await api.post("/posts", form, {
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

    const handleEdit = (post) => {
        setForm({ title: post.title, body: post.body });
        setEditId(post._id);
    };

    const handleDelete = async (id) => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("You must be logged in");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this post?")) return;

        try {
            await api.delete(`/posts/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Post deleted");
            fetchPosts();
        } catch (err) {
            console.error(err);
            alert("Failed to delete post");
        }
    };

    const addBlog = () => {
        document.getElementById('add-blog').style.display = 'block';
    }
    const CancelBlog = () => {
        document.getElementById('add-blog').style.display = 'none';
    }


    return (
        <div className="container mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3>Posts</h3> <button className="btn btn-success" onClick={addBlog}>  
                    <i className="bi bi-plus-lg me-1"></i>
                    Add Blog</button>
            </div>


            <form id='add-blog' style={{ display: 'none' }} onSubmit={handleSubmit} className="mb-4 mt-3">
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
                    name="body"
                    placeholder="Content"
                    value={form.body}
                    onChange={handleChange}
                    required
                />
                <button className="btn btn-primary mt-2" type="submit">
                    <i className="bi bi-plus-lg me-1"></i>
                    {editId ? "Update Post" : "Create Post"}
                </button>
                <button className="btn btn-warning mt-2 ms-3 text-light" onClick={CancelBlog}>
                    <i className="bi bi-x-lg me-1"></i>
                    Cancel
                </button>
                {editId && (
                    <button
                        type="button"
                        className="btn btn-secondary mt-2 ms-2"
                        onClick={() => {
                            setEditId(null);
                            setForm({ title: "", body: "" });
                        }}
                    >
                        Cancel
                    </button>
                )}
            </form>

            <div className="container mt-5">
                <div className="row g-3">
                    {posts
                        .map((post) => (
                            <div key={post._id} className="col-md-3">
                                <div className="card h-100">
                                    <div className="card-body ">
                                        <h5 className="card-title">{post.title}</h5>
                                        <p className="card-text">{post.body}</p>
                                        <button
                                            className="btn btn-warning me-2 text-light"
                                            onClick={() => handleEdit(post)}
                                        >
                                            <i className="bi bi-pencil-fill me-1 "></i> Edit
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => handleDelete(post._id)}
                                        >
                                            <i className="bi bi-trash-fill me-1"></i>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}
