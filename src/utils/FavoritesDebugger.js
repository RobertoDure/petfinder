import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_IDS_STORAGE_KEY = 'user_favorite_pet_ids';
const FAVORITES_PETS_STORAGE_KEY = 'user_favorite_pets_data';

const FavoritesDebugger = {
  /**
   * Log current favorites to console for debugging
   */
  logFavorites: async () => {
    try {
      const favoriteIdsStr = await AsyncStorage.getItem(FAVORITES_IDS_STORAGE_KEY);
      const favoritePetsStr = await AsyncStorage.getItem(FAVORITES_PETS_STORAGE_KEY);
      
      console.log('=== FAVORITES DEBUG INFO ===');
      console.log('Favorite IDs:', favoriteIdsStr ? JSON.parse(favoriteIdsStr) : 'None');
      console.log('Cached Pets Count:', favoritePetsStr ? JSON.parse(favoritePetsStr).length : 0);
      console.log('===========================');
    } catch (error) {
      console.error('Error logging favorites:', error);
    }
  },

  /**
   * Clear all favorites data for debugging
   */
  clearAllFavorites: async () => {
    try {
      await AsyncStorage.removeItem(FAVORITES_IDS_STORAGE_KEY);
      await AsyncStorage.removeItem(FAVORITES_PETS_STORAGE_KEY);
      console.log('All favorites data cleared for debugging');
    } catch (error) {
      console.error('Error clearing favorites:', error);
    }
  },

  /**
   * Get storage info for debugging
   */
  getStorageInfo: async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const favoriteKeys = keys.filter(key => key.includes('favorite'));
      
      console.log('=== STORAGE DEBUG INFO ===');
      console.log('All storage keys:', keys);
      console.log('Favorite-related keys:', favoriteKeys);
      console.log('==========================');
      
      return { allKeys: keys, favoriteKeys };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { allKeys: [], favoriteKeys: [] };
    }
  }
};

export default FavoritesDebugger;
