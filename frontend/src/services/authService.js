import api from './api';

/**
 * Log in a user with email and password
 */
export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data; // returns { success, token, data: user }
};

/**
 * Register a new user account
 */
export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data; // returns { success, token, data: user }
};

/**
 * Fetch current authenticated user's profile
 */
export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data; // returns { success, data: user }
};

/**
 * Reset user password with email and new password
 */
export const forgotPasswordUser = async (email, password) => {
  const response = await api.post('/auth/forgot-password', { email, password });
  return response.data; // returns { success, message }
};
