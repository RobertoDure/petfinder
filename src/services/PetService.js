import apiClient from './apiClient';

// Centralized validation functions
const validateImages = (imageFiles) => {
  if (!imageFiles || !Array.isArray(imageFiles)) {
    return { valid: false, error: 'No images provided. Please add pet images.' };
  }
  if (imageFiles.length < 3) {
    return { valid: false, error: `A minimum of 3 images is required for each pet. Currently you have ${imageFiles.length} image(s).` };
  }
  // Additional image validations could be added here (file size, dimensions, etc.)
  return { valid: true };
};

const PetService = {
  getAllPets: async () => {
    try {
      const response = await apiClient.get('/pets');
      return response.data;
    } catch (error) {
      console.error('Error fetching pets:', error);
      throw error;
    }
  },
  
  getPetById: async (id) => {
    try {
      const response = await apiClient.get(`/pets/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching pet with ID ${id}:`, error);
      throw error;
    }
  },
  
  getPetsByType: async (type) => {
    try {
      const response = await apiClient.get(`/pets/type/${type}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching pets of type ${type}:`, error);
      throw error;
    }
  },
  
  getPetsByStatus: async (status) => {
    try {
      const response = await apiClient.get(`/pets/status/${status}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching pets with status ${status}:`, error);
      throw error;
    }
  },
  
  getPetsByCity: async (city) => {
    try {
      const response = await apiClient.get(`/pets/city/${city}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching pets in city ${city}:`, error);
      throw error;
    }
  },
  
  getPetsByUserId: async (userId) => {
    try {
      const response = await apiClient.get(`/pets/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching pets for user ${userId}:`, error);
      throw error;
    }
  },  createPet: async (petData) => {
    try {
      const response = await apiClient.post('/pets', petData);
      return response.data;
    } catch (error) {
      if (error.response?.status === 400) {
        error.message =
          error.response.data?.error || 'Invalid pet data. Please check all required fields.';
      } else if (error.request) {
        error.message = 'Network error. Please check your connection.';
      }
      throw error;
    }
  },
    createPetWithImages: async (petData, imageFiles) => {
    try {
      // Validate images first
      const validation = validateImages(imageFiles);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
        // Create FormData object to send both pet data and images in one request
      const formData = new FormData();
      
      // Add pet data as a JSON string in a field called 'pet'
      formData.append('pet', JSON.stringify(petData));
      
      // Add each image file to the form data
      imageFiles.forEach((file, index) => {
        formData.append('images', {
          uri: file.uri,
          type: 'image/jpeg',
          name: file.name || `pet_image_${index}.jpg`,
        });
      });
      
      // Make a multipart form request with both pet data and images
      const response = await apiClient.post('/pets/with-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating pet with images:', error);
      
      // Enhanced error handling
      if (error.response) {
        // The server responded with an error status
        console.error('Server error response:', {
          status: error.response.status,
          data: error.response.data
        });
        
        // Extract error message from response if available
        if (error.response.data && error.response.data.error) {
          error.message = error.response.data.error;
        }
      }
      
      throw error;
    }
  },
  
  // This is a special function to handle the specific API flow required by the backend
  createPetWithImagesBackend: async (petData, imageFiles) => {
    try {
      // Ensure we have enough images
      const validation = validateImages(imageFiles);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
        // Step 1: Create form data with images only
      const formData = new FormData();
      
      // Add each image file to the form data
      imageFiles.forEach((file, index) => {
        formData.append('images', {
          uri: file.uri,
          type: 'image/jpeg',
          name: file.name || `pet_image_${index}.jpg`,
        });
      });
      
      // Step 2: First upload images to temporary storage to get image IDs
      let imagesResponse;
      try {
        imagesResponse = await apiClient.post('/pets/temp-images', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 seconds timeout
        });
      } catch (uploadError) {
        // Handle specific image upload errors
        if (!uploadError.response) {
          console.error('Network error during image upload:', uploadError);
          uploadError.message = 'Network error during image upload. Please check your connection and try again.';
        }
        throw uploadError;
      }
      
      // Step 3: Get image IDs from response
      const imageIds = imagesResponse.data.imageIds || [];
      
      // Step 4: Add image IDs to pet data
      const petWithImages = {
        ...petData,
        imageIds: imageIds
      };
      
      // Step 5: Create the pet with the image IDs included
      try {
        const petResponse = await apiClient.post('/pets', petWithImages);
        return petResponse.data;
      } catch (petCreateError) {
        // Handle specific pet creation errors
        if (!petCreateError.response) {
          console.error('Network error during pet creation:', petCreateError);
          petCreateError.message = 'Network error during pet creation. Please check your connection and try again.';
        }
        throw petCreateError;
      }
    } catch (error) {
      console.error('Error in createPetWithImagesBackend:', error);
      
      if (error.response) {
        console.error('Server error response:', {
          status: error.response.status,
          data: error.response.data
        });
        
        if (error.response.data && error.response.data.error) {
          error.message = error.response.data.error;
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Network error - no response received:', error.request);
        error.message = 'Network error. The server is not responding. Please try again later.';      } else if (error.message && error.message.includes('Network Error')) {
        // Specific handling for network errors
        console.error('Network connection issue detected');
        error.message = 'Network connection issue. Please check your internet connection and try again.';
      }
      
      throw error;
    }
  },
  
  uploadPetImages: async (petId, imageFiles) => {
    try {
      // Validate images first
      const validation = validateImages(imageFiles);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
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
  
  updatePet: async (id, petData) => {
    try {
      const response = await apiClient.put(`/pets/${id}`, petData);
      return response.data;
    } catch (error) {
      console.error(`Error updating pet with ID ${id}:`, error);
      throw error;
    }
  },
  
  deletePet: async (id) => {
    try {
      const response = await apiClient.delete(`/pets/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting pet with ID ${id}:`, error);
      throw error;
    }
  },
    // Search and filtering methods
  searchPets: async (searchParams) => {
    try {
      const response = await apiClient.get('/pets/search', { params: searchParams });
      return response.data;
    } catch (error) {
      console.error('Error searching pets:', error);
      throw error;
    }
  },
  
  getFavoritePets: async (userId) => {
    try {
      const response = await apiClient.get(`/pets/favorites/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching favorite pets for user ${userId}:`, error);
      throw error;
    }
  },
  
  addToFavorites: async (userId, petId) => {
    try {
      const response = await apiClient.post(`/pets/favorites/${userId}/${petId}`);
      return response.data;
    } catch (error) {
      console.error(`Error adding pet ${petId} to favorites:`, error);
      throw error;
    }
  },
  
  removeFromFavorites: async (userId, petId) => {
    try {
      const response = await apiClient.delete(`/pets/favorites/${userId}/${petId}`);
      return response.data;
    } catch (error) {
      console.error(`Error removing pet ${petId} from favorites:`, error);
      throw error;
    }
  },
    createPetWithEncodedImages: async (petData, imageFiles) => {
    try {
      // Validate images first
      const validation = validateImages(imageFiles);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      // Prepare the images array to include in the pet data
      const processedImages = [];
      
      // Process each image file to be included directly in the pet object
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        
        try {
          // Read the image as base64
          const response = await fetch(file.uri);
          const blob = await response.blob();
          
          // Use a promise to read the blob as base64
          const base64data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              // Get the base64 string without the prefix
              const base64 = reader.result.split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
            processedImages.push({
            fileName: file.name || `pet_image_${i}.jpg`,
            fileType: 'image/jpeg',
            data: base64data,
            // No petId yet as the pet hasn't been created
          });
        } catch (fileError) {
          console.error(`Error processing image file ${i}:`, fileError);
          throw new Error(`Failed to process image ${i+1}. Please try again with a different image.`);
        }
      }
      
      // All images processed, now create pet with images included
      const petWithImages = {
        ...petData,
        images: processedImages
      };
      
      // Send the complete pet object with images to the API
      const response = await apiClient.post('/pets', petWithImages);
      return response.data;
      
    } catch (error) {
      console.error('Error in createPetWithEncodedImages:', error);
      
      // Enhanced error handling
      if (error.response) {
        console.error('Server error response:', {
          status: error.response.status,
          data: error.response.data
        });
        
        if (error.response.data && error.response.data.error) {
          error.message = error.response.data.error;
        }
      }
      
      throw error;
    }
  },
};

export default PetService;
