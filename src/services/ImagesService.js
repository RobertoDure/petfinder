import apiClient from './apiClient';

const ImagesService = {
  // Get image by ID - returns the binary data
  getImageById: async (imageId) => {
    try {
      const response = await apiClient.get(`/pets/images/${imageId}`, {
        responseType: 'arraybuffer' // Important for binary data
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching image with ID ${imageId}:`, error);
      throw error;
    }
  },
  
  // Get all images for a pet
  getPetImages: async (petId) => {
    try {
      const response = await apiClient.get(`/pets/${petId}/images`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching images for pet ${petId}:`, error);
      throw error;
    }
  },
  
  // Upload images for a pet
  uploadPetImages: async (petId, imageFiles) => {
    try {
      const formData = new FormData();
        imageFiles.forEach((file, index) => {
        formData.append('images', {
          uri: file.uri,
          type: 'image/jpeg',
          name: file.name || `pet_image_${index}.jpg`,
        });
      });
      
      const response = await apiClient.post(`/pets/${petId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error uploading images for pet ${petId}:`, error);
      throw error;
    }
  },
  
  // Delete an image
  deleteImage: async (imageId) => {
    try {
      const response = await apiClient.delete(`/pets/images/${imageId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting image ${imageId}:`, error);
      throw error;
    }
  },
  
  // Helper method to get image URI from image ID
  getImageUri: (imageId) => {
    const { baseURL } = apiClient.defaults;
    return `${baseURL}/pets/images/${imageId}`;
  }
};

export default ImagesService;
