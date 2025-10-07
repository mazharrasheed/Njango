import React from 'react'
import { Link } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Navbar({ authToken }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const { user } = useContext(AuthContext);

  return (
    <>
        <nav className="navbar navbar-expand-lg navbar-light nav-bg">
          <div className="container-fluid">
            <a className="navbar-brand" href="#">Njango Blog</a>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarSupportedContent">
              <ul className="navbar-nav me-auto ms-auto mb-2 mb-lg-0">
                {
                  authToken &&
                  <>
                    <li className="nav-item me-3">
                      <Link className="nav-link " to="/blog">Blog</Link>
                    </li>
                    <li className="nav-item me-3">
                      <Link className="nav-link " to="/profile">Profile</Link>
                    </li>
                    <li className="nav-item me-3">
                      <Link className="nav-link " to="/createuser">Create User</Link>
                    </li>
                    
                  </>
                }
                {!authToken &&
                  <>
                    <li className="nav-item me-3">
                      <Link className="nav-link " to="/register">Register</Link>
                    </li>
                    <li className="nav-item me-3">
                      <Link className="nav-link " to="/login">Login</Link>
                    </li>
                  </>
                }
                {
                  authToken &&
                  <li className="nav-item me-3">
                    <Link className="nav-link " to="/logout">Logout</Link>
                  </li>
                }
              </ul>
            </div>
          </div>
        </nav>
    </>
  )
}
