// src/pages/login.jsx
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { fetchUser,setToken,setUser } = useContext(AuthContext);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/login', form);

      // Save token
      localStorage.setItem('token', res.data.token);
      console.log('token at login',res.data.token)
      
      // Update global auth state
      setToken(res.data.token)
      
      // Optionally save basic user info (if returned by backend)
      if (res.data.user) {
        console.log('loing in user',res.data.user)
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user)
      }

      navigate('/blog');
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container mt-5'>
      <div className='login-form p-4 border rounded'>
        <h1 className='card-header'><img className='me-3' src="/Njango-logo-img.png" width={100} alt="" />Login</h1>
        <form onSubmit={handleSubmit}>
          <input
            className='form-control mt-3'
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
          />
          <input
            className='form-control mt-3'
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <div className='d-flex justify-content-between align-items-center mt-3'>
            <a className='text-decoration-none text-dark' href="/reset-password">
              Reset Password
            </a>
            <a className='text-decoration-none text-dark' href="/register">
              Register
            </a>
          </div>

          <button
            className='btn btn-success mt-3 w-100'
            type="submit"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
