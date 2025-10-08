import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function PostCreate() {
  const [form, setForm] = useState({ title: '', body: '' });
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/posts', form);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Post creation failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Title" onChange={handleChange} />
      <textarea name="body" placeholder="Body" onChange={handleChange}></textarea>
      <button type="submit">Create Post</button>
    </form>
  );
}