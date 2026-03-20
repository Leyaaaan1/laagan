import { BASE_URL   } from '@env';


const API_BASE_URL = BASE_URL;
export const loginUser = async (username, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/riders/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.json();

        if (response.   ok) {
            return { success: true, data: result };
        } else {
            return { success: false, message: result.message || 'Login failed' };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Network error occurred' };
    }
};


export const registerUser = async (username, password, riderType) => {
    try {
        const response = await fetch(`${API_BASE_URL}/riders/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, riderType }),
        });

        const result = await response.json();

        if (response.ok) {
            return { success: true, data: result };
        } else {
            return { success: false, message: result.message || 'Registration failed' };
        }
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, message: 'Network error occurred' };
    }
};

