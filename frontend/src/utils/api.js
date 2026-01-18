const API_BASE_URL = '/api';

export const getAuthToken = () => localStorage.getItem('token');

export const setAuthToken = (token) => {
    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
};

export const setUser = (user) => {
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
    } else {
        localStorage.removeItem('user');
    }
};

export const getUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const fetchWithAuth = async (endpoint, options = {}) => {
    const token = getAuthToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Handle FormData (don't set Content-Type)
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // Handle 401 Unauthorized (token expired)
        if (response.status === 401) {
            setAuthToken(null);
            setUser(null);
            window.location.href = '/'; // Redirect to login
            return;
        }

        return response;
    } catch (error) {
        console.error('API Request Failed:', error);
        throw error;
    }
};
