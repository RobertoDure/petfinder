import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

const FAVORITES_IDS_STORAGE_KEY = 'user_favorite_pet_ids';
const FAVORITES_PETS_STORAGE_KEY = 'user_favorite_pets_data';

const FavoritesService = {
  /**
   * Get favorite pet IDs from local storage
   * @returns {Promise<Array>} List of favorite pet IDs
   */  getFavoriteIds: async () => {
    try {
      const favoriteIdsStr = await AsyncStorage.getItem(FAVORITES_IDS_STORAGE_KEY);
      if (!favoriteIdsStr) {
        return [];
      }
      
      const favoriteIds = JSON.parse(favoriteIdsStr);
      
      // Ensure it's an array and filter out invalid values
      if (!Array.isArray(favoriteIds)) {
        console.warn('Invalid favorites data format, resetting to empty array');
        await AsyncStorage.setItem(FAVORITES_IDS_STORAGE_KEY, JSON.stringify([]));
        return [];
      }
      
      // Filter out null, undefined, empty strings, and non-numeric values
      const validIds = favoriteIds.filter(id => 
        id != null && 
        id !== '' && 
        !isNaN(Number(id))
      );
      
      // If we filtered out invalid items, update storage
      if (validIds.length !== favoriteIds.length) {
        console.warn('Filtered out invalid pet IDs, updating storage');
        await AsyncStorage.setItem(FAVORITES_IDS_STORAGE_KEY, JSON.stringify(validIds));
      }
      
      return validIds;
    } catch (error) {
      console.error('Error getting favorite IDs:', error);
      // Reset storage on error
      try {
        await AsyncStorage.setItem(FAVORITES_IDS_STORAGE_KEY, JSON.stringify([]));
      } catch (resetError) {
        console.error('Error resetting favorites storage:', resetError);
      }
      return [];
    }
  },

  /**
   * Get all favorite pets for the current user
   * @returns {Promise<Array>} List of favorite pets
   */
  getFavorites: async () => {
    try {      // Get favorite IDs from local storage
      const favoriteIds = await FavoritesService.getFavoriteIds();
      
      console.log('Favorite IDs being sent to API:', favoriteIds);
      
      if (favoriteIds.length === 0) {
        console.log('No favorite IDs found, returning empty array');
        return [];
      }
      
      // Validate and convert IDs to numbers (API expects Long values)
      const validIds = favoriteIds
        .filter(id => id != null && id !== '' && !isNaN(id))
        .map(id => Number(id));
      
      if (validIds.length === 0) {
        console.log('No valid pet IDs found after filtering');
        return [];
      }
      
      console.log('Valid pet IDs after filtering:', validIds);      // Send POST request with pet IDs array wrapped in a proper object
      // The API is expecting a properly formatted JSON request with the array in a field
      const requestBody = { ids: validIds };
      console.log('Making API request with body:', requestBody);
      
      const response = await apiClient.post('/pets/favorites', requestBody);
      //console.log('API Response:', response.data);
      
      // Store the detailed pet data locally for offline access
      await AsyncStorage.setItem(FAVORITES_PETS_STORAGE_KEY, JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      console.error('Error fetching favorites:', error.response ? {
        status: error.response.status,
        data: error.response.data
      } : error.message);
      
      // Try to get cached pet data from local storage as fallback
      try {
        const cachedPetsStr = await AsyncStorage.getItem(FAVORITES_PETS_STORAGE_KEY);
        return cachedPetsStr ? JSON.parse(cachedPetsStr) : [];
      } catch (storageError) {
        console.error('Error getting cached favorites:', storageError);
        return [];
      }
    }
  },
    /**
   * Add a pet to favorites
   * @param {string|number} petId - ID of the pet to add to favorites
   * @returns {Promise<boolean>} Success status
   */  addFavorite: async (petId) => {
    try {
      // Validate pet ID
      if (!petId || petId === null || petId === undefined || petId === '') {
        console.error('Pet ID is required to add to favorites');
        return false;
      }
      
      // Convert to number to ensure consistency
      const numericPetId = Number(petId);
      if (isNaN(numericPetId)) {
        console.error('Pet ID must be a valid number:', petId);
        return false;
      }
      
      // Get current favorite IDs
      const favoriteIds = await FavoritesService.getFavoriteIds();
      
      // Check if pet is already in favorites
      if (favoriteIds.includes(numericPetId)) {
        return true; // Already a favorite
      }
      
      // Add pet ID to favorites
      const updatedIds = [...favoriteIds, numericPetId];
      await AsyncStorage.setItem(FAVORITES_IDS_STORAGE_KEY, JSON.stringify(updatedIds));
      
      return true;
    } catch (error) {
      console.error(`Error adding pet ${petId} to favorites:`, error);
      return false;
    }
  },

  /**
   * Remove a pet from favorites
   * @param {string|number} petId - ID of the pet to remove from favorites
   * @returns {Promise<boolean>} Success status
   */  removeFavorite: async (petId) => {
    try {
      // Convert to number for consistent comparison
      const numericPetId = Number(petId);
      
      // Get current favorite IDs
      const favoriteIds = await FavoritesService.getFavoriteIds();
      
      // Remove pet ID from favorites (compare as numbers)
      const updatedIds = favoriteIds.filter(id => Number(id) !== numericPetId);
      await AsyncStorage.setItem(FAVORITES_IDS_STORAGE_KEY, JSON.stringify(updatedIds));
      
      // Also update cached pets data by removing the pet
      try {
        const cachedPetsStr = await AsyncStorage.getItem(FAVORITES_PETS_STORAGE_KEY);
        if (cachedPetsStr) {
          const cachedPets = JSON.parse(cachedPetsStr);
          const updatedPets = cachedPets.filter(pet => Number(pet.id) !== numericPetId);
          await AsyncStorage.setItem(FAVORITES_PETS_STORAGE_KEY, JSON.stringify(updatedPets));
        }
      } catch (cacheError) {
        console.error('Error updating cached pets:', cacheError);
      }
      
      return true;
    } catch (error) {
      console.error(`Error removing pet ${petId} from favorites:`, error);
      return false;
    }
  },
    /**
   * Check if a pet is in the user's favorites
   * @param {string|number} petId - ID of the pet to check
   * @returns {Promise<boolean>} Whether the pet is a favorite
   */  isFavorite: async (petId) => {
    try {
      const favoriteIds = await FavoritesService.getFavoriteIds();
      const numericPetId = Number(petId);
      return favoriteIds.some(id => Number(id) === numericPetId);
    } catch (error) {
      console.error(`Error checking if pet ${petId} is favorite:`, error);
      return false;
    }
  },

  /**
   * Toggle favorite status for a pet
   * @param {string|number} petId - ID of the pet to toggle
   * @returns {Promise<boolean>} New favorite status
   */
  toggleFavorite: async (petId) => {
    const isFav = await FavoritesService.isFavorite(petId);
    
    if (isFav) {
      await FavoritesService.removeFavorite(petId);
      return false;
    } else {
      await FavoritesService.addFavorite(petId);
      return true;
    }
  },

  /**
   * Clear all favorites
   * @returns {Promise<boolean>} Success status
   */
  clearFavorites: async () => {
    try {
      await AsyncStorage.removeItem(FAVORITES_IDS_STORAGE_KEY);
      await AsyncStorage.removeItem(FAVORITES_PETS_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing favorites:', error);
      return false;
    }
  }
};

export default FavoritesService;
