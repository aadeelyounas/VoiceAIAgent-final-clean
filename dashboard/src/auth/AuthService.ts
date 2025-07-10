import axios from 'axios';

interface User {
  id: number | string;
  username: string;
  email: string;
  password: string;
}

const API_URL = 'http://localhost:3002';

export const register = async (username: string, email: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/users`, {
      username,
      email,
      password,
      id: Date.now()
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
    throw new Error('Registration failed');
  }
};

export const login = async (email: string, password: string) => {
  try {
    // Get all users and filter client-side for better reliability
    const response = await axios.get(`${API_URL}/users`, {
      timeout: 5000 // 5 second timeout
    });
    const users = response.data || [];

    // Find user with matching email
    const user = users.find((u: User) => u.email === email);
    if (!user) {
      throw new Error('Invalid email');
    }

    // Verify password
    if (user.password !== password) {
      throw new Error('Invalid password');
    }

    return user;
  } catch (error) {
    console.error('Login error:', error);
    // Preserve original error messages
    if (error instanceof Error) {
      if (error.message === 'Invalid email' || error.message === 'Invalid password') {
        throw error;
      }
      if (axios.isAxiosError(error)) {
        throw new Error('Login service unavailable. Please try again later.');
      }
      // Handle non-Axios errors
      throw new Error(`Login failed: ${error.message}`);
    }
    // Fallback for non-Error instances
    throw new Error('Login failed due to unexpected error');
  }
};

export const checkEmailExists = async (email: string) => {
  try {
    const response = await axios.get(`${API_URL}/users`, {
      params: { email }
    });
    return response.data.length > 0;
  } catch (error) {
    console.error('Email check failed:', error);
    throw error;
  }
};