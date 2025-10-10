import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Logout({ setToken }) {
  const { setUser } = useContext(AuthContext);
  useEffect(() => {
    localStorage.removeItem('token');
    setToken(null); // updates app state instantly
    setUser(null); // clear user state
    localStorage.removeItem('user'); // clear user data from localStorage
  }, [setToken]);

  return <Navigate to="/login" replace />;
}
