# Image Compression Usage Examples

## Basic Usage in AddPetScreen

The AddPetScreen now includes comprehensive image management with automatic compression:

```javascript
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import ImageUtils from '../utils/ImageUtils';

const MyComponent = () => {
  const [images, setImages] = useState([]);
  const [compressing, setCompressing] = useState(false);

  const pickAndCompressImage = async () => {
    setCompressing(true);
    try {
      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets) {
        // Compress for pet profile
        const compressedUri = await ImageUtils.compressForPetProfile(result.assets[0].uri);
        
        setImages(prev => [...prev, {
          uri: compressedUri,
          compressed: true,
        }]);
      }
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setCompressing(false);
    }
  };

  return (
    // Your UI here
  );
};
```

## Different Compression Types

### Pet Profile Images (500x500px, ~100-300KB)
```javascript
const compressedUri = await ImageUtils.compressForPetProfile(originalUri);
```

### Thumbnail Images (150x150px, ~50KB)
```javascript
const thumbnailUri = await ImageUtils.compressForThumbnail(originalUri);
```

### Hero/Banner Images (800x600px, ~500KB)
```javascript
const heroUri = await ImageUtils.compressForHero(originalUri);
```

## Custom Compression Options

```javascript
const customCompressedUri = await ImageUtils.compressForPetProfile(originalUri, {
  targetWidth: 400,
  targetHeight: 400,
  quality: 0.7,
  maxFileSize: 200000, // 200KB
  format: 'JPEG'
});
```

## File Size Utilities

```javascript
// Estimate file size
const estimatedSize = ImageUtils.estimateFileSize(500, 500, 0.8);
console.log('Estimated size:', ImageUtils.formatFileSize(estimatedSize));

// Check if compression needed
const needsCompression = await ImageUtils.needsCompression(imageUri, 300000);
if (needsCompression) {
  // Compress the image
}
```

## Integration with AddPetScreen Features

The enhanced AddPetScreen includes:

### Camera and Library Access
- Platform-specific action sheets (iOS) and alerts (Android)
- Automatic permission handling
- Multiple image selection from library
- Single image capture from camera

### Real-time Compression Feedback
- Loading indicators during compression
- Success badges on compressed images
- File size and compression information display
- Error handling with fallback options

### Smart Image Management
- Maximum 5 images with clear limits
- Automatic quality adjustment if files too large
- Sequential processing to prevent memory issues
- Remove/replace individual images

## Configuration in app.json

Make sure your app.json includes the image picker configuration:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "The app accesses your photos to let you share them with your friends.",
          "cameraPermission": "The app accesses your camera to take photos of your pets.",
          "microphonePermission": "The app accesses your microphone for video recording."
        }
      ]
    ]
  }
}
```

## Performance Tips

1. **Process images sequentially** to avoid memory issues
2. **Use URI references** instead of base64 for better performance  
3. **Provide user feedback** during compression
4. **Cache compressed images** to avoid re-compression
5. **Monitor file sizes** to ensure targets are met

## Error Handling

The implementation includes comprehensive error handling:

```javascript
try {
  const compressedUri = await ImageUtils.compressForPetProfile(originalUri);
  // Success - use compressed image
} catch (error) {
  console.error('Compression failed:', error);
  // Fallback - use original image or show error message
}
```

## Testing

To test the compression functionality:

1. **Select large images** (> 5MB) to see compression in action
2. **Monitor console logs** to see compression progress
3. **Check final file sizes** to ensure they meet targets
4. **Test both camera and library** image sources
5. **Verify on different devices** (iOS/Android)
