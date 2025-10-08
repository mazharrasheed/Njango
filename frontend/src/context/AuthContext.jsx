// src/context/AuthContext.jsx
import { useState, useEffect, createContext, useContext, useMemo } from "react";
import api from '../api';
import RequestUser from "../utils/requestUser";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    // Load from localStorage
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // When token changes, optionally you could re-fetch user from backend
    useEffect(() => {
        if (!user && token) {
            // Try to restore user data from API (if backend supports /me)
            api.get('/user', { headers: { Authorization: `Bearer ${token}` } })
                .then(res => {
                    setUser(res.data);
                    localStorage.setItem('user', JSON.stringify(res.data));
                })
                .catch(err => {
                    console.error('Failed to fetch user:', err);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setToken(null);
                    setUser(null);
                });
        }
    }, [token]);


    const requestUser = useMemo(() => new RequestUser(user), [user]);

    console.log('req.user', requestUser.user)
    console.log('req.user', requestUser.permissions)

    return (
        <AuthContext.Provider value={{ requestUser, user, setUser, token, setToken }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
