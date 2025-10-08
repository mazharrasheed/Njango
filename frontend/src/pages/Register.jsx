import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Register() {
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', firstName: '', lastName: '' });
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Password validation
    if (form.password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    try {
      const res = await api.post('/auth/register', {
        username: form.username,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
      });

      localStorage.setItem('token', res.data.token);
      alert('Registration successful');
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className='container mt-5'>
      <div className='register-form p-4'>
        <h1 className='card-header'>Register</h1>
        <form onSubmit={handleSubmit}>
          <input className='form-control mt-3' name="firstName" placeholder="First Name" onChange={handleChange} required />
          <input className='form-control mt-3' name="lastName" placeholder="Last Name" onChange={handleChange} required  />
          <input className='form-control mt-3' name="username" placeholder="Username" onChange={handleChange} required  />
          <input className='form-control mt-3' type="password" name="password" placeholder="Password" onChange={handleChange} required  />
          <input className='form-control mt-3' type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange} required  />
          <button className='btn btn-info mt-3' type="submit">Register</button>
        </form>
      </div>
    </div>
  );
}