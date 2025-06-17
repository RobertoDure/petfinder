import * as Location from 'expo-location';
import apiClient from './apiClient';

const LocationService = {
  /**
   * Get the current device location
   * @returns {Promise<object>} Location object with latitude and longitude
   */
  getCurrentLocation: async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  },
  
  /**
   * Reverse geocode coordinates to get address information
   * @param {number} latitude - Location latitude
   * @param {number} longitude - Location longitude
   * @returns {Promise<object>} Address details
   */
  reverseGeocode: async (latitude, longitude) => {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      if (results.length > 0) {
        return {
          address: results[0].street || '',
          city: results[0].city || '',
          state: results[0].region || '',
          zipCode: results[0].postalCode || '',
          country: results[0].country || '',
          latitude,
          longitude,
        };
      }
      
      throw new Error('No address found for the provided coordinates');
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      throw error;
    }
  },
  
  /**
   * Forward geocode an address to get coordinates
   * @param {string} address - The address to geocode
   * @returns {Promise<object>} Geocoding results with coordinates
   */
  geocodeAddress: async (address) => {
    try {
      const results = await Location.geocodeAsync(address);
      
      if (results.length > 0) {
        return {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        };
      }
      
      throw new Error('No coordinates found for the provided address');
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  },
  
  /**
   * Get nearby pets based on current location
   * @param {number} radius - Search radius in kilometers
   * @returns {Promise<array>} List of nearby pets
   */
  getNearbyPets: async (radius = 10) => {
    try {
      // Get current location
      const location = await LocationService.getCurrentLocation();
      
      // Call API to get nearby pets
      const response = await apiClient.get('/pets/nearby', {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          radius,
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting nearby pets:', error);
      throw error;
    }
  },
  
  /**
   * Calculate distance between two coordinates
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number} Distance in kilometers
   */
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }
};

export default LocationService;
