import apiClient from './apiClient';

const UsersService = {
  getAllUsers: async () => {
    try {
      const response = await apiClient.get('/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
  
  getUserById: async (id) => {
    try {
      const response = await apiClient.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      throw error;
    }
  },
  
  getUserByEmail: async (email) => {
    try {
      const response = await apiClient.get(`/users/email/${email}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user with email ${email}:`, error);
      throw error;
    }
  },
  
  getUsersByType: async (type) => {
    try {
      const response = await apiClient.get(`/users/type/${type}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching users of type ${type}:`, error);
      throw error;
    }
  },
  
  getUsersByCity: async (city) => {
    try {
      const response = await apiClient.get(`/users/city/${city}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching users in city ${city}:`, error);
      throw error;
    }
  },
  
  createUser: async (userData) => {
    try {
      const response = await apiClient.post('/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },
  
  updateUser: async (id, userData) => {
    try {
      const response = await apiClient.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user with ID ${id}:`, error);
      throw error;
    }
  },
  
  deleteUser: async (id) => {
    try {
      const response = await apiClient.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      throw error;
    }
  },
};

export default UsersService;
