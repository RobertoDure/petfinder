import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdoptionService = {
  /**
   * Express interest in adopting a pet
   * @param {string|number} petId - ID of the pet
   * @param {object} adoptionRequest - Adoption request details
   * @returns {Promise<object>} Adoption request response
   */
  expressInterest: async (petId, adoptionRequest) => {
    try {
      // Get user info to include in request
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      
      if (!userInfoStr) {
        throw new Error('User not logged in');
      }
      
      const userInfo = JSON.parse(userInfoStr);
      
      const requestData = {
        ...adoptionRequest,
        petId,
        adopterId: userInfo.id,
      };
      
      const response = await apiClient.post('/adoptions/request', requestData);
      return response.data;
    } catch (error) {
      console.error(`Error expressing interest in pet ${petId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get adoptions requested by current user
   * @returns {Promise<Array>} List of adoption requests
   */
  getMyAdoptionRequests: async () => {
    try {
      // Get user info to get the user ID
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      
      if (!userInfoStr) {
        throw new Error('User not logged in');
      }
      
      const userInfo = JSON.parse(userInfoStr);
      
      const response = await apiClient.get(`/adoptions/user/${userInfo.id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching adoption requests:', error);
      throw error;
    }
  },
  
  /**
   * Get adoption requests for pets owned by current user
   * @returns {Promise<Array>} List of adoption requests
   */
  getReceivedAdoptionRequests: async () => {
    try {
      // Get user info to get the user ID
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      
      if (!userInfoStr) {
        throw new Error('User not logged in');
      }
      
      const userInfo = JSON.parse(userInfoStr);
      
      const response = await apiClient.get(`/adoptions/owner/${userInfo.id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching received adoption requests:', error);
      throw error;
    }
  },
  
  /**
   * Approve an adoption request
   * @param {string|number} requestId - ID of the adoption request
   * @returns {Promise<object>} Updated adoption request
   */
  approveAdoptionRequest: async (requestId) => {
    try {
      const response = await apiClient.put(`/adoptions/${requestId}/approve`);
      return response.data;
    } catch (error) {
      console.error(`Error approving adoption request ${requestId}:`, error);
      throw error;
    }
  },
  
  /**
   * Reject an adoption request
   * @param {string|number} requestId - ID of the adoption request
   * @param {string} reason - Reason for rejection
   * @returns {Promise<object>} Updated adoption request
   */
  rejectAdoptionRequest: async (requestId, reason) => {
    try {
      const response = await apiClient.put(`/adoptions/${requestId}/reject`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error rejecting adoption request ${requestId}:`, error);
      throw error;
    }
  },
  
  /**
   * Cancel an adoption request made by the current user
   * @param {string|number} requestId - ID of the adoption request
   * @returns {Promise<object>} Cancellation response
   */
  cancelAdoptionRequest: async (requestId) => {
    try {
      const response = await apiClient.put(`/adoptions/${requestId}/cancel`);
      return response.data;
    } catch (error) {
      console.error(`Error canceling adoption request ${requestId}:`, error);
      throw error;
    }
  },
  
  /**
   * Finalize an adoption after it has been approved
   * @param {string|number} requestId - ID of the adoption request
   * @returns {Promise<object>} Finalized adoption
   */
  finalizeAdoption: async (requestId) => {
    try {
      const response = await apiClient.put(`/adoptions/${requestId}/finalize`);
      return response.data;
    } catch (error) {
      console.error(`Error finalizing adoption ${requestId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get details for a specific adoption request
   * @param {string|number} requestId - ID of the adoption request
   * @returns {Promise<object>} Adoption request details
   */
  getAdoptionRequestById: async (requestId) => {
    try {
      const response = await apiClient.get(`/adoptions/${requestId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching adoption request ${requestId}:`, error);
      throw error;
    }
  }
};

export default AdoptionService;
