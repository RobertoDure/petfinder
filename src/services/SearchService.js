import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_SEARCHES_KEY = 'saved_searches';
const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 10;

const SearchService = {
  /**
   * Search for pets with various filters
   * @param {object} filters - Search filters
   * @returns {Promise<Array>} Search results
   */
  searchPets: async (filters = {}) => {
    try {
      const response = await apiClient.get('/pets/search', { params: filters });
      
      // Save to recent searches
      await SearchService.addRecentSearch(filters);
      
      return response.data;
    } catch (error) {
      console.error('Error searching pets:', error);
      throw error;
    }
  },
  
  /**
   * Search for pets by type
   * @param {string} type - Pet type (DOG/CAT)
   * @returns {Promise<Array>} Search results
   */
  searchByType: async (type) => {
    try {
      const response = await apiClient.get(`/pets/type/${type}`);
      return response.data;
    } catch (error) {
      console.error(`Error searching pets by type ${type}:`, error);
      throw error;
    }
  },
  
  /**
   * Search for pets by status
   * @param {string} status - Pet status (AVAILABLE/PENDING/ADOPTED)
   * @returns {Promise<Array>} Search results
   */
  searchByStatus: async (status) => {
    try {
      const response = await apiClient.get(`/pets/status/${status}`);
      return response.data;
    } catch (error) {
      console.error(`Error searching pets by status ${status}:`, error);
      throw error;
    }
  },
  
  /**
   * Search for pets by breed
   * @param {string} breed - Pet breed
   * @returns {Promise<Array>} Search results
   */
  searchByBreed: async (breed) => {
    try {
      const response = await apiClient.get('/pets/search', {
        params: { breed }
      });
      return response.data;
    } catch (error) {
      console.error(`Error searching pets by breed ${breed}:`, error);
      throw error;
    }
  },
  
  /**
   * Search for pets by location
   * @param {string} city - City to search in
   * @param {number} [radius] - Search radius in kilometers
   * @returns {Promise<Array>} Search results
   */
  searchByLocation: async (city, radius) => {
    try {
      const params = { city };
      if (radius) {
        params.radius = radius;
      }
      
      const response = await apiClient.get('/pets/search', { params });
      return response.data;
    } catch (error) {
      console.error(`Error searching pets by location ${city}:`, error);
      throw error;
    }
  },
  
  /**
   * Save a search for later use
   * @param {object} searchParams - Search parameters
   * @param {string} name - Name for the saved search
   * @returns {Promise<boolean>} Success status
   */
  saveSearch: async (searchParams, name) => {
    try {
      // Get current saved searches
      const savedSearchesStr = await AsyncStorage.getItem(SAVED_SEARCHES_KEY);
      const savedSearches = savedSearchesStr ? JSON.parse(savedSearchesStr) : [];
      
      // Create new saved search
      const newSavedSearch = {
        id: Date.now().toString(),
        name,
        params: searchParams,
        createdAt: new Date().toISOString(),
      };
      
      // Add to saved searches
      savedSearches.push(newSavedSearch);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(savedSearches));
      
      return true;
    } catch (error) {
      console.error('Error saving search:', error);
      return false;
    }
  },
  
  /**
   * Get all saved searches
   * @returns {Promise<Array>} Saved searches
   */
  getSavedSearches: async () => {
    try {
      const savedSearchesStr = await AsyncStorage.getItem(SAVED_SEARCHES_KEY);
      return savedSearchesStr ? JSON.parse(savedSearchesStr) : [];
    } catch (error) {
      console.error('Error getting saved searches:', error);
      return [];
    }
  },
  
  /**
   * Delete a saved search
   * @param {string} searchId - ID of the saved search to delete
   * @returns {Promise<boolean>} Success status
   */
  deleteSavedSearch: async (searchId) => {
    try {
      // Get current saved searches
      const savedSearchesStr = await AsyncStorage.getItem(SAVED_SEARCHES_KEY);
      
      if (!savedSearchesStr) {
        return false;
      }
      
      const savedSearches = JSON.parse(savedSearchesStr);
      
      // Filter out the search to delete
      const updatedSearches = savedSearches.filter(search => search.id !== searchId);
      
      // Save updated searches
      await AsyncStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updatedSearches));
      
      return true;
    } catch (error) {
      console.error(`Error deleting saved search ${searchId}:`, error);
      return false;
    }
  },
  
  /**
   * Add a search to recent searches
   * @param {object} searchParams - Search parameters
   * @returns {Promise<boolean>} Success status
   */
  addRecentSearch: async (searchParams) => {
    try {
      // Get current recent searches
      const recentSearchesStr = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      const recentSearches = recentSearchesStr ? JSON.parse(recentSearchesStr) : [];
      
      // Create new recent search
      const newRecentSearch = {
        id: Date.now().toString(),
        params: searchParams,
        timestamp: new Date().toISOString(),
      };
      
      // Add to recent searches (at the beginning)
      const updatedSearches = [newRecentSearch, ...recentSearches]
        // Remove duplicates (based on stringified params)
        .filter((search, index, self) => 
          index === self.findIndex(s => 
            JSON.stringify(s.params) === JSON.stringify(search.params)
          )
        )
        // Limit to max number of recent searches
        .slice(0, MAX_RECENT_SEARCHES);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
      
      return true;
    } catch (error) {
      console.error('Error adding recent search:', error);
      return false;
    }
  },
  
  /**
   * Get recent searches
   * @returns {Promise<Array>} Recent searches
   */
  getRecentSearches: async () => {
    try {
      const recentSearchesStr = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      return recentSearchesStr ? JSON.parse(recentSearchesStr) : [];
    } catch (error) {
      console.error('Error getting recent searches:', error);
      return [];
    }
  },
  
  /**
   * Clear all recent searches
   * @returns {Promise<boolean>} Success status
   */
  clearRecentSearches: async () => {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing recent searches:', error);
      return false;
    }
  }
};

export default SearchService;
