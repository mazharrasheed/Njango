import { useState, useEffect,useContext } from 'react';
import api from '../api'; // axios instance with baseURL configured
import {Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';


export default function Profile() {
  // const [user, setUser] = useState (JSON.parse(localStorage.getItem('user')));
  const [loading, setLoading] = useState(true);

   // ✅ Parse user JSON string into object
  const [user,setUser ]= useState( JSON.parse(localStorage.getItem('user')));

  console.log('profile',user)

  const {token,setToken} = useContext(AuthContext)

  const fetchUser = () => {
    setLoading(true);
    api
      .get(`auth/user/${user.id}`)
      .then((res) => {
        const cleanUser = res.data.user
        console.log('clean user',cleanUser)
        setUser(cleanUser);
      })
      .catch((err) => console.error("Failed to fetch users", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const checkToken = async () => {
      try {
        if (!token) {
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
fetchUser()
    checkToken();
  }, []);


  if (loading) return <p>Loading...</p>;

  if (!user) return <p>You are not logged in.</p>;

  return (
    <div className="container mt-5">
      <h1>Profile</h1>
      <p>Welcome, <strong>{user.firstName} {user.lastName}</strong>!</p>
      <p>Username: {user.username}</p>
      <p>Role: {user.role}</p>
      <Link className="btn btn-info " to="/blog">Posts</Link>
    </div>

    
  );
}

