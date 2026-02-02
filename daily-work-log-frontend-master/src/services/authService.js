import api from './apiService';

// Auth service functions
export const authService = {
  // User login
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },
  
  // User registration (for admin use)
  register: (userData) => {
    return api.post('/auth/register', userData);
  },
  
  // Get current user profile
  getCurrentUser: () => {
    return api.get('/auth/me');
  },
  
  // Change password
  changePassword: (passwordData) => {
    return api.post('/auth/change-password', passwordData);
  },
  
  // Logout (client-side only, token will be removed in AuthContext)
  logout: () => {
    // This is handled in the AuthContext by removing the token
    return Promise.resolve();
  }
};

export default authService;
