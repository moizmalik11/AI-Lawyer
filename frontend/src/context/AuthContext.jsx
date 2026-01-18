import { createContext, useContext, useState, useEffect } from 'react';
import { fetchWithAuth, getAuthToken, getUser, setAuthToken, setUser as setStorageUser } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getUser());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if token exists and is valid (optional: verify with backend)
        const token = getAuthToken();
        if (token && !user) {
            // If we have a token but no user in state, try to restore from storage
            setUser(getUser());
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const response = await fetchWithAuth('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (data.success) {
            setAuthToken(data.token);
            setStorageUser(data.user);
            setUser(data.user);
            return { success: true };
        }
        return { success: false, error: data.error };
    };

    const register = async (username, email, password) => {
        const response = await fetchWithAuth('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password }),
        });
        const data = await response.json();
        return data;
    };

    const logout = () => {
        setAuthToken(null);
        setStorageUser(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
