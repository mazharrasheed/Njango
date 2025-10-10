import React from 'react'
import { Link } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from "../../api"; // axios instance
export default function AdminNavbar({ authToken }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const { user } = useContext(AuthContext);
  const [models, setModels] = useState([])

  // Fetch models
  useEffect(() => {
    api
      .get("/models")
      .then((res) => setModels(res.data.models))
      .catch((err) => console.error("Failed to fetch permissions", err));
  }, []);

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark text-light bg-dark">
        <div className="container-fluid">
          <a className="navbar-brand" href="#"><img className='me-3' src="/Njango-logo-ico.png" width={40} alt="" />Njango Admin Dashboard</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto ms-auto mb-2 mb-lg-0">

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
                  <Link className="nav-link " to="/">View Site</Link>
                </li>
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

      <div className="d-flex flex-column flex-shrink-0 p-3 text-dark bg-light" style={{ width: '320px', height: '90vh', }}>
        <h3 class="nav-item nav-link text-light bg-dark p-2">
          <span class="fs-4">Site Adminstration</span>
       </h3>
        <hr />

        <ul class="nav nav-pills flex-column mb-auto">
          <li class="nav-item">
            <Link to="/admin/auth" class="nav-link bg-dark text-white">
              Authentication and Authorization
            </Link>

          </li>
          <li class="nav-item">
            <Link to="#" class="nav-link" aria-current="page">
            
              Groups
            </Link>
          </li>
          <li>
            <Link to="/admin/createuser" class="nav-link">
             
              Users
            </Link>
          </li>
          <hr />
          <li>
            <Link to="/admin/auth" class="nav-link bg-dark text-white">
             
              Blog
            </Link>

          </li>

          <li>
            <a href="#" class="nav-link ">
             
              Blogs
            </a>
          </li>
          <li>
            <li>
              <Link to="/admin/auth" class="nav-link bg-dark text-white">
               
                Store
              </Link>

            </li>
            <a href="#" class="nav-link ">
             
              Products
            </a>
          </li>
          <li>
            <a href="#" class="nav-link">
             
              Customers
            </a>
          </li>
        </ul>
        <hr />
        <div class="dropdown">
          <a href="#" class="d-flex align-items-center text-dark text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
            <img src="https://github.com/mdo.png" alt="" width="32" height="32" class="rounded-circle me-2" />
            <strong>mdo</strong>
          </a>
          <ul class="dropdown-menu dropdown-menu-dark text-small shadow" aria-labelledby="dropdownUser1">
            <li><a class="dropdown-item" href="#">New project...</a></li>
            <li><a class="dropdown-item" href="#">Settings</a></li>
            <li><a class="dropdown-item" href="#">Profile</a></li>
            <li><hr class="dropdown-divider" /></li>
            <li><a class="dropdown-item" href="#">Sign out</a></li>
          </ul>
        </div>
      </div>
    </>
  )
}




