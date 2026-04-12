import {api} from './Apiclient';

export const loginUser = async (username, password) => {
  try {
    const response = await api.publicPost('/riders/login', {
      username,
      password,
    });
    const result = await response.json();
    if (response.ok) return {success: true, data: result};
    return {success: false, message: result.message || 'Login failed'};
  } catch (error) {
    console.error('Login error:', error);
    return {success: false, message: 'Network error occurred'};
  }
};

export const registerUser = async (username, password, riderType) => {
  try {
    const response = await api.publicPost('/riders/register', {
      username,
      password,
      riderType,
    });
    const result = await response.json();
    if (response.ok) return {success: true, data: result};
    return {success: false, message: result.message || 'Registration failed'};
  } catch (error) {
    console.error('Registration error:', error);
    return {success: false, message: 'Network error occurred'};
  }
};
