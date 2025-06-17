/**
 * Image Utility Service
 * Provides image compression, resizing, and optimization utilities
 */

import * as ImageManipulator from 'expo-image-manipulator';

class ImageUtils {
  /**
   * Compress and resize image to optimal size for pet photos
   * @param {string} imageUri - URI of the image to compress
   * @param {object} options - Compression options
   * @returns {Promise<string>} - URI of compressed image
   */
  static async compressForPetProfile(imageUri, options = {}) {
    const defaultOptions = {
      targetWidth: 500,
      targetHeight: 500,
      quality: 0.8,
      maxFileSize: 300000, // 300KB target
      format: 'JPEG',
    };

    const settings = { ...defaultOptions, ...options };    try {
      console.log(`Compressing image: ${imageUri}`);
      
      // Use expo-image-manipulator for compression (Expo Go compatible)
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: settings.targetWidth, height: settings.targetHeight } }],
        {
          compress: settings.quality,
          format: settings.format === 'JPEG' 
            ? ImageManipulator.SaveFormat.JPEG 
            : ImageManipulator.SaveFormat.PNG,
          base64: false,
        }
      );

      console.log(`Image compressed successfully: ${manipulatedImage.uri}`);
      return manipulatedImage.uri;
    } catch (error) {
      console.error('Error in image compression:', error);
      return imageUri; // Return original if all fails
    }
  }

  /**
   * Compress image for thumbnails (smaller size)
   * @param {string} imageUri - URI of the image to compress
   * @returns {Promise<string>} - URI of compressed thumbnail
   */
  static async compressForThumbnail(imageUri) {
    return this.compressForPetProfile(imageUri, {
      targetWidth: 150,
      targetHeight: 150,
      quality: 0.7,
      maxFileSize: 50000, // 50KB target for thumbnails
    });
  }

  /**
   * Compress image for hero/banner images (larger size)
   * @param {string} imageUri - URI of the image to compress
   * @returns {Promise<string>} - URI of compressed hero image
   */
  static async compressForHero(imageUri) {
    return this.compressForPetProfile(imageUri, {
      targetWidth: 800,
      targetHeight: 600,
      quality: 0.85,
      maxFileSize: 500000, // 500KB target for hero images
    });
  }

  /**
   * Get estimated file size of an image (approximate)
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @param {number} quality - Compression quality (0-1)
   * @returns {number} - Estimated file size in bytes
   */
  static estimateFileSize(width, height, quality) {
    // Rough estimation: 3 bytes per pixel * quality factor
    const baseSizePerPixel = 3;
    const qualityFactor = quality;
    return Math.round(width * height * baseSizePerPixel * qualityFactor);
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted file size string
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  /**
   * Check if image needs compression based on file size
   * @param {string} imageUri - URI of the image
   * @param {number} maxSizeBytes - Maximum allowed file size
   * @returns {Promise<boolean>} - True if compression needed
   */
  static async needsCompression(imageUri, maxSizeBytes = 300000) {
    try {
      // This is a simplified check - in a real implementation,
      // you might want to get actual file size from the URI
      return true; // For now, always compress to ensure consistency
    } catch (error) {
      console.error('Error checking file size:', error);
      return true; // Default to compression if we can't determine size
    }
  }
}

export default ImageUtils;
