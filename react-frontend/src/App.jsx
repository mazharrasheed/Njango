import { useContext, useState } from 'react'
import { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.min.js'
import "bootstrap-icons/font/bootstrap-icons.css";
import './assets/style.css'
import { Navigate, Routes, Route, useFetcher } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext';
import { AuthContext } from './context/AuthContext';
import Blog from './pages/Blog'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Navbar from './pages/Navbar'
import Logout from './pages/Logout'
import Posts from './pages/Posts'
import CreateUser from './pages/CreateUser'


function App() {

  const {token,setToken} = useContext(AuthContext)
  console.log('form app :', token)

  return (
    <>
   
      <Navbar authToken={token} />
      <Routes>
        <Route path="/createuser" element={token ? <CreateUser /> : <Navigate to="/login" />} />
        <Route path="/blog" element={token ? <Blog /> : <Navigate to="/login" />} />
        <Route path="/profile" element={token ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/posts" element={token ? <Posts /> : <Navigate to="/login" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login setToken={setToken}   />} />
        <Route path="/logout" element={<Logout setToken={setToken} />} />
      </Routes>

    </>
    
  )
}

export default App
