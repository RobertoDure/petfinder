import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { AuthContext } from '../context/AuthContext';
import PetService from '../services/PetService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import breedsData from '../data/breeds.json';
import petOptions from '../data/petOptions.json';

const AddPetScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imageCompressing, setImageCompressing] = useState(false);
  const [localUserInfo, setLocalUserInfo] = useState(userInfo);
    // Fetch user info from AsyncStorage if not available in context
  useEffect(() => {
    const checkUserInfo = async () => {
      // If userInfo from context is valid, use it
      if (userInfo && userInfo.id) {
        setLocalUserInfo(userInfo);
        return;
      }
      
      // Otherwise try to get from AsyncStorage
      try {
        const storedUserInfo = await AsyncStorage.getItem('userInfo');
        if (storedUserInfo) {
          const parsedUserInfo = JSON.parse(storedUserInfo);
          console.log('User info from AsyncStorage:', parsedUserInfo);
          
          // Use the parsed userInfo even if it doesn't have an id
          // We'll handle missing id in the submit function
          if (parsedUserInfo) {
            // If the user has a username but no id, we'll still use it
            setLocalUserInfo(parsedUserInfo);
          }
        }
      } catch (error) {
        console.error('Error fetching user info from storage:', error);
      }
    };
    
    checkUserInfo();
  }, [userInfo]);    // Pet details state
  const [name, setName] = useState('');
  const [type, setType] = useState('DOG'); // 'DOG' or 'CAT'
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState(null); // 'MALE', 'FEMALE', or 'UNKNOWN'
  const [birthDate, setBirthDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [size, setSize] = useState('');
  const [weight, setWeight] = useState('');
  // Handle pet type change and reset breed
  const handleTypeChange = (newType) => {
    setType(newType);
    setBreed(''); // Reset breed when type changes
    setWeight(''); // Reset weight when type changes (different ranges for dogs/cats)
    // Size and color can remain the same as they're not type-specific
  };
  const [color, setColor] = useState('');
  
  // Health state
  const [vaccinated, setVaccinated] = useState(false);
  const [neutered, setNeutered] = useState(false);
  const [specialNeeds, setSpecialNeeds] = useState(false);
  const [specialNeedsDescription, setSpecialNeedsDescription] = useState('');
  
  // Location state
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  // Image compression function optimized for Expo Go
  const compressAndResizeImage = async (imageUri) => {
    try {
      console.log('Starting compression for:', imageUri);
      console.log('Original URI length:', imageUri.length);
      
      // Multi-stage compression using only expo-image-manipulator for Expo Go compatibility
      let currentUri = imageUri;
      let compressionQuality = 0.8; // Start with 80% quality
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          console.log(`Compression attempt ${attempts + 1} with quality ${compressionQuality}`);
          
          const manipulatedImage = await ImageManipulator.manipulateAsync(
            currentUri,
            [{ resize: { width: 500, height: 500 } }],
            {
              compress: compressionQuality,
              format: ImageManipulator.SaveFormat.JPEG,
              base64: false,
            }
          );
          
          console.log(`Compression result attempt ${attempts + 1}:`, manipulatedImage);
          currentUri = manipulatedImage.uri;
          
          // For Expo Go, we'll accept the result after the first successful manipulation
          // since we can't easily check file size
          break;
          
        } catch (error) {
          console.log(`Compression attempt ${attempts + 1} failed:`, error);
          
          // Reduce quality for next attempt
          compressionQuality = Math.max(0.4, compressionQuality - 0.2);
          attempts++;
          
          if (attempts === maxAttempts) {
            console.log('All compression attempts failed, using original image');
            currentUri = imageUri;
          }
        }
      }
      
      console.log('Final compressed URI:', currentUri);
      return currentUri;
    } catch (error) {
      console.error('Error in compression:', error);
      // Return original URI if compression fails
      return imageUri;
    }
  };

  // Request camera permissions
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  };

  // Request media library permissions
  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  // Show image picker options
  const showImagePickerOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            openCamera();
          } else if (buttonIndex === 2) {
            openImageLibrary();
          }
        }
      );
    } else {
      Alert.alert(
        'Select Image',
        'Choose from where you want to select an image',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: openCamera },
          { text: 'Choose from Library', onPress: openImageLibrary },
        ]
      );
    }
  };

  // Open camera
  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert(
        'Camera Permission',
        'Camera permission is required to take photos',
        [{ text: 'OK' }]
      );
      return;
    }

    setImageCompressing(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for pet photos
        quality: 0.9, // High quality before our compression
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processSelectedImages(result.assets);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    } finally {
      setImageCompressing(false);
    }
  };

  // Open image library
  const openImageLibrary = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) {
      Alert.alert(
        'Library Permission',
        'Photo library permission is required to select images',
        [{ text: 'OK' }]
      );
      return;
    }

    setImageCompressing(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        allowsEditing: false, // Disable editing for multiple selection
        quality: 0.9, // High quality before our compression
        exif: false,
        selectionLimit: 5 - images.length, // Limit based on remaining slots
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processSelectedImages(result.assets);
      }
    } catch (error) {
      console.error('Error opening image library:', error);
      Alert.alert('Error', 'Failed to open image library. Please try again.');
    } finally {
      setImageCompressing(false);
    }
  };

  // Process selected images
  const processSelectedImages = async (selectedAssets) => {
    try {
      const remainingSlots = 5 - images.length;
      const assetsToProcess = selectedAssets.slice(0, remainingSlots);
      
      if (selectedAssets.length > remainingSlots) {
        Alert.alert(
          'Image Limit',
          `You can only add ${remainingSlots} more image(s). First ${remainingSlots} image(s) will be added.`
        );
      }

      const compressedImages = [];
      
      for (let i = 0; i < assetsToProcess.length; i++) {
        const asset = assetsToProcess[i];
        console.log(`Processing image ${i + 1}/${assetsToProcess.length}:`, asset.uri);
        
        try {
          const compressedUri = await compressAndResizeImage(asset.uri);
          compressedImages.push({
            ...asset,
            uri: compressedUri,
            compressed: true,
          });
          console.log(`Successfully processed image ${i + 1}`);
        } catch (error) {
          console.error(`Error processing image ${i + 1}:`, error);
          // Add original image if compression fails
          compressedImages.push(asset);
        }
      }

      setImages(prevImages => [...prevImages, ...compressedImages]);
      
      if (compressedImages.length > 0) {
        Alert.alert(
          'Success',
          `${compressedImages.length} image(s) added and optimized for upload!`
        );
      }
    } catch (error) {
      console.error('Error processing images:', error);
      Alert.alert('Error', 'Failed to process images. Please try again.');
    }
  };

  const pickImages = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can add maximum 5 images');
      return;
    }
    
    showImagePickerOptions();
  };
    const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
    
    // Format date as YYYY-MM-DD
    const formattedDate = currentDate.toISOString().split('T')[0];
    setBirthDate(formattedDate);
  };  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  // Convert weight range string to numeric value for API
  const convertWeightToNumber = (weightRange) => {
    if (!weightRange) return null;
    
    if (weightRange.includes('Under')) {
      // Extract number from "Under X kg"
      const match = weightRange.match(/Under (\d+)/);
      return match ? parseFloat(match[1]) / 2 : null; // Use half of the upper bound
    } else if (weightRange.includes('Over')) {
      // Extract number from "Over X kg"  
      const match = weightRange.match(/Over (\d+)/);
      return match ? parseFloat(match[1]) + 5 : null; // Add 5kg to the threshold
    } else if (weightRange.includes('-')) {
      // Extract range like "5-10 kg" and use the middle value
      const match = weightRange.match(/(\d+)-(\d+)/);
      if (match) {
        const min = parseFloat(match[1]);
        const max = parseFloat(match[2]);
        return (min + max) / 2;
      }
    } else {
      // Try to extract any number
      const match = weightRange.match(/(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : null;
    }
    
    return null;
  };    const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for your pet');
      return false;
    }
    
    if (!breed.trim()) {
      Alert.alert('Error', 'Please select a breed');
      return false;
    }
    
    if (!gender) {
      Alert.alert('Error', 'Please select a gender');
      return false;
    }
    
    if (!size.trim()) {
      Alert.alert('Error', 'Please select a size');
      return false;
    }
    
    if (!weight.trim()) {
      Alert.alert('Error', 'Please select a weight range');
      return false;
    }
    
    if (!color.trim()) {
      Alert.alert('Error', 'Please select a color');
      return false;
    }
    
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return false;
    }
    
    if (!city.trim()) {
      Alert.alert('Error', 'Please enter a city');
      return false;
    }
    
    if (!state.trim()) {
      Alert.alert('Error', 'Please enter a state/province');
      return false;
    }
    
    if (!zipCode.trim()) {
      Alert.alert('Error', 'Please enter a ZIP code');
      return false;
    }
    
    if (!country.trim()) {
      Alert.alert('Error', 'Please enter a country');
      return false;
    }
    
    if (images.length < 3) {
      Alert.alert('Error', 'Please add at least 3 images of your pet');
      return false;
    }
    
    return true;
  };const handleAddPet = async () => {
    // Validate required fields first
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Log the user info states for debugging
      console.log('Context userInfo:', userInfo);
      console.log('Local userInfo:', localUserInfo);
      
      // Generate a temporary user ID if one is not available
      let effectiveUserInfo = {...localUserInfo};
      
      if (!localUserInfo) {
        // Try one more time to get user info from storage
        try {
          const storedUserInfo = await AsyncStorage.getItem('userInfo');
          if (storedUserInfo) {
            const parsedUserInfo = JSON.parse(storedUserInfo);
            if (parsedUserInfo) {
              effectiveUserInfo = parsedUserInfo;
              setLocalUserInfo(parsedUserInfo);
            } else {
              throw new Error('No valid user data');
            }
          } else {
            throw new Error('No stored user data');
          }
        } catch (error) {
          console.error('Final attempt to get user info failed:', error);
          Alert.alert('Error', 'User information is missing. Please log in again.');
          setLoading(false);
          return;
        }
      }
      
      // If we still don't have a user ID but have a username, create a temporary ID
      if (!effectiveUserInfo.id && effectiveUserInfo.username) {
        // Create a simple hash from the username as a temporary ID
        const tempId = `temp_${effectiveUserInfo.username}_${Date.now()}`;
        console.log('Using temporary user ID:', tempId);
        effectiveUserInfo.id = tempId;
      } else if (!effectiveUserInfo.id && !effectiveUserInfo.username) {
        // If we have neither ID nor username, we can't proceed
        Alert.alert('Error', 'User information is incomplete. Please log in again.');
        setLoading(false);
        return;
      }      // Create pet data object
      const petData = {
        name,
        type,
        breed,
        gender,
        birthDate: birthDate || null,
        description,
        size,
        weight: convertWeightToNumber(weight),
        color,
        vaccinated,
        neutered,        specialNeeds,
        specialNeedsDescription: specialNeeds ? specialNeedsDescription : null,
        status: 'AVAILABLE',
        tutorId: effectiveUserInfo.id, // Add the tutor ID from our effective user info
        location: {
          address,
          city,
          state,
          zipCode,
          country,
          // In a real app, we would geocode the address to get coordinates
          latitude: null,
          longitude: null,
        },
      };// Verify we have enough images
      if (!images || images.length === 0) {
        setLoading(false);
        Alert.alert('Error', 'No images provided. Please add pet images.');
        return;
      }
      
      if (images.length < 3) {
        setLoading(false);
        Alert.alert('Error', `A minimum of 3 images is required for each pet. Currently you have ${images.length} image(s).`);
        return;
      }
    // Use the approach that matches the API specification - sending images directly in the Pet object
      try {        console.log('Creating pet with encoded images...');
        const newPet = await PetService.createPetWithEncodedImages(petData, images);
        Alert.alert(
          'Success',
          `${name} has been added for adoption!`,
          [{ text: 'OK', onPress: () => {
            resetForm();
            navigation.navigate('Home');
          }}]
        );
        return;
      } catch (err) {
        console.log('Error creating pet with encoded images:', err.message);
        
        // If it's a network error, show a friendly message with retry option
        if (!err.response && err.message.includes('Network Error')) {
          setLoading(false);
          Alert.alert(
            'Connection Error',
            'Could not connect to the server. Please check your internet connection and try again.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Retry', 
                onPress: () => {
                  setLoading(true);
                  // Small delay before retry
                  setTimeout(() => handleAddPet(), 1000);
                } 
              }
            ]
          );
          return;
        }
        
        // If the error is specifically about images, don't continue with other methods
        if (err.message && (
            err.message.includes('image') || 
            err.message.includes('minimum') ||
            err.message.includes('required'))
        ) {
          setLoading(false);
          Alert.alert('Error', err.message);
          return;
        }
        
        // If the main approach fails but it's not a critical error, try the fallback approach
        try {
          console.log('Main approach failed, trying fallback method...');
          // Try traditional two-step process as fallback
          const newPet = await PetService.createPet(petData);          await PetService.uploadPetImages(newPet.id, images);
            Alert.alert(
            'Success',
            `${name} has been added for adoption!`,
            [{ text: 'OK', onPress: () => {
              resetForm();
              navigation.navigate('Home');
            }}]
          );
          return;
        } catch (fallbackErr) {
          // If the fallback also fails, propagate the original error
          console.error('Fallback approach also failed:', fallbackErr);
          throw err;
        }
      }
    } catch (finalError) {
      // If all approaches fail, handle it here
      console.error('All pet creation approaches failed:', finalError);
      
      // Create a more user-friendly error message
      let errorMessage = 'Failed to add pet. Please try again.';
      let offerRetry = true;
        // Handle custom error messages from our own code
      if (finalError.message && (
          finalError.message.includes('images') || 
          finalError.message.includes('minimum') ||
          finalError.message.includes('required')
      )) {
        errorMessage = finalError.message;
        offerRetry = false; // No need to retry for validation errors
      }
      // Handle network errors
      else if (finalError.message && finalError.message.includes('Network Error')) {
        errorMessage = 'Connection issue. Please check your internet and try again.';
        offerRetry = true;
      }
      // Handle server response errors
      else if (finalError.response) {
        // The server responded with an error status
        console.log('Server error response:', finalError.response);
        
        if (finalError.response.data && finalError.response.data.error) {
          errorMessage = finalError.response.data.error;
        } else if (finalError.response.data && finalError.response.data.message) {
          errorMessage = finalError.response.data.message;
          
          // Special handling for user ID related errors
          if (errorMessage.includes('tutor') || errorMessage.includes('user') || errorMessage.includes('id')) {
            errorMessage = 'There is an issue with your account. Please log out and log in again to refresh your profile.';
          }
        } else if (finalError.response.status === 400) {
          if (finalError.response.data && typeof finalError.response.data === 'object') {
            // Try to extract the first validation error
            const firstErrorKey = Object.keys(finalError.response.data)[0];
            if (firstErrorKey && finalError.response.data[firstErrorKey]) {
              errorMessage = `${firstErrorKey}: ${finalError.response.data[firstErrorKey]}`;
            } else {
              errorMessage = 'The pet data is invalid or missing required fields.';
            }
          } else {
            errorMessage = 'The pet data is invalid or missing required fields.';
          }
        } else if (finalError.response.status === 401) {
          errorMessage = 'You are not authorized to perform this action. Please log in again.';
        }
      } else if (finalError.request) {
        // No response received
        errorMessage = 'Network error. Please check your internet connection.';
        offerRetry = true;
      }
      
      // Finally show error to user with retry option if appropriate
      if (offerRetry) {
        Alert.alert(
          'Error', 
          errorMessage,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Retry', 
              onPress: () => {
                setLoading(true);
                // Small delay before retry
                setTimeout(() => handleAddPet(), 1000);
              } 
            }
          ]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };  // Reset form function to clear all fields
  const resetForm = () => {
    // Pet details
    setName('');
    setType('DOG');
    setBreed('');
    setGender(null);
    setBirthDate('');
    setSelectedDate(new Date());
    setDescription('');
    setSize('');
    setWeight('');
    setColor('');
    
    // Health
    setVaccinated(false);
    setNeutered(false);
    setSpecialNeeds(false);
    setSpecialNeedsDescription('');
    
    // Location
    setAddress('');
    setCity('');
    setState('');
    setZipCode('');
    setCountry('');
    
    // Images
    setImages([]);
  };

  // For demo, allow all users to add pets regardless of role
  const isTutor = true;
  
  if (!isTutor) {
    return (
      <View style={styles.container}>
        <View style={styles.notTutorContainer}>
          <Ionicons name="paw" size={70} color="#CCCCCC" />
          <Text style={styles.notTutorText}>
            You need to be registered as a tutor to add pets for adoption.
          </Text>
          <TouchableOpacity
            style={styles.becomeTutorButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.becomeTutorButtonText}>Become a Tutor</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Add a Pet for Adoption</Text>
        </View>
          <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pet Images</Text>
          <Text style={styles.sectionDescription}>
            Upload up to 5 photos of your pet. Images will be automatically optimized for faster loading.
          </Text>
          {imageCompressing && (
            <View style={styles.compressionStatus}>
              <ActivityIndicator size="small" color="#4CAF50" />
              <Text style={styles.compressionText}>Optimizing images...</Text>
            </View>
          )}
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.imagesContainer}
          >
            {images.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image.uri }} style={styles.petImage} />
                {image.compressed && (
                  <View style={styles.compressedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="white" />
                </TouchableOpacity>
              </View>
            ))}
            
            {images.length < 5 && (
              <TouchableOpacity
                style={[styles.addImageButton, imageCompressing && styles.addImageButtonDisabled]}
                onPress={pickImages}
                disabled={imageCompressing}
              >
                <Ionicons 
                  name="camera" 
                  size={32} 
                  color={imageCompressing ? "#CCC" : "#2196F3"} 
                />
                <Text style={[styles.addImageText, imageCompressing && styles.addImageTextDisabled]}>
                  {imageCompressing ? 'Processing...' : 'Add Photo'}
                </Text>
                <Text style={[styles.addImageSubtext, imageCompressing && styles.addImageTextDisabled]}>
                  Camera or Library
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
            {images.length > 0 && (
            <View style={styles.imageInfo}>
              <Text style={styles.imageInfoText}>
                📸 {images.length}/5 images • Photos optimized to 500×500px with Expo compression
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Pet Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter pet name"
              placeholderTextColor="#999"
            />
          </View>
            <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Pet Type *</Text>
            <View style={styles.segmentContainer}>
              <TouchableOpacity
                style={[styles.segmentButton, type === 'DOG' && styles.segmentActive]}
                onPress={() => handleTypeChange('DOG')}
              >
                <Text style={[styles.segmentText, type === 'DOG' && styles.segmentActiveText]}>
                  Dog
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentButton, type === 'CAT' && styles.segmentActive]}
                onPress={() => handleTypeChange('CAT')}
              >
                <Text style={[styles.segmentText, type === 'CAT' && styles.segmentActiveText]}>
                  Cat
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Breed *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={breed}
                style={styles.picker}
                onValueChange={(itemValue) => setBreed(itemValue)}
              >
                <Picker.Item label="Select a breed..." value="" />
                {breedsData[type].map((breedOption) => (
                  <Picker.Item key={breedOption} label={breedOption} value={breedOption} />
                ))}
              </Picker>
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Gender *</Text>
            <View style={styles.segmentContainer}>
              <TouchableOpacity
                style={[styles.segmentButton, gender === 'MALE' && styles.segmentActive]}
                onPress={() => setGender('MALE')}
              >
                <Text style={[styles.segmentText, gender === 'MALE' && styles.segmentActiveText]}>
                  Male
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentButton, gender === 'FEMALE' && styles.segmentActive]}
                onPress={() => setGender('FEMALE')}
              >
                <Text style={[styles.segmentText, gender === 'FEMALE' && styles.segmentActiveText]}>
                  Female
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentButton, gender === 'UNKNOWN' && styles.segmentActive]}
                onPress={() => setGender('UNKNOWN')}
              >
                <Text style={[styles.segmentText, gender === 'UNKNOWN' && styles.segmentActiveText]}>
                  Unknown
                </Text>
              </TouchableOpacity>
            </View>
          </View>
            <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Birth Date (approximate)</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={showDatePickerModal}
            >
              <Text style={[styles.datePickerText, !birthDate && styles.placeholderText]}>
                {birthDate || 'Select birth date'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1990, 0, 1)}
              />
            )}
          </View>
            <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Size</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={size}
                style={styles.picker}
                onValueChange={(itemValue) => setSize(itemValue)}
              >
                <Picker.Item label="Select size..." value="" />
                {petOptions.sizes.map((sizeOption) => (
                  <Picker.Item key={sizeOption} label={sizeOption} value={sizeOption} />
                ))}
              </Picker>
            </View>
          </View>
          
          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.inputLabel}>Weight Range</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={weight}
                  style={styles.picker}
                  onValueChange={(itemValue) => setWeight(itemValue)}
                >
                  <Picker.Item label="Select weight range..." value="" />
                  {petOptions.weightRanges[type].map((weightOption) => (
                    <Picker.Item key={weightOption} label={weightOption} value={weightOption} />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Color</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={color}
                  style={styles.picker}
                  onValueChange={(itemValue) => setColor(itemValue)}
                >
                  <Picker.Item label="Select color..." value="" />
                  {petOptions.colors.map((colorOption) => (
                    <Picker.Item key={colorOption} label={colorOption} value={colorOption} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your pet's personality, habits, etc."
              placeholderTextColor="#999"
              multiline
              textAlignVertical="top"
              numberOfLines={4}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Information</Text>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Vaccinated</Text>
            <Switch
              value={vaccinated}
              onValueChange={setVaccinated}
              trackColor={{ false: "#CCC", true: "#FFB6B6" }}
              thumbColor={vaccinated ? "#FF6B6B" : "#F4F3F4"}
            />
          </View>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Neutered/Spayed</Text>
            <Switch
              value={neutered}
              onValueChange={setNeutered}
              trackColor={{ false: "#CCC", true: "#FFB6B6" }}
              thumbColor={neutered ? "#FF6B6B" : "#F4F3F4"}
            />
          </View>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Special Needs</Text>
            <Switch
              value={specialNeeds}
              onValueChange={setSpecialNeeds}
              trackColor={{ false: "#CCC", true: "#FFB6B6" }}
              thumbColor={specialNeeds ? "#FF6B6B" : "#F4F3F4"}
            />
          </View>
          
          {specialNeeds && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Special Needs Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={specialNeedsDescription}
                onChangeText={setSpecialNeedsDescription}
                placeholder="Describe special needs or medical conditions"
                placeholderTextColor="#999"
                multiline
                textAlignVertical="top"
                numberOfLines={3}
              />
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Street address"
              placeholderTextColor="#999"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>City *</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="City"
              placeholderTextColor="#999"
            />
          </View>
          
          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.inputLabel}>State/Province</Text>
              <TextInput
                style={styles.input}
                value={state}
                onChangeText={setState}
                placeholder="State"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.inputLabel}>ZIP Code</Text>
              <TextInput
                style={styles.input}
                value={zipCode}
                onChangeText={setZipCode}
                placeholder="ZIP code"
                placeholderTextColor="#999"
              />
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Country</Text>
            <TextInput
              style={styles.input}
              value={country}
              onChangeText={setCountry}
              placeholder="Country"
              placeholderTextColor="#999"
            />
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleAddPet}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Add Pet for Adoption</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  imagesContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 5,
    minHeight: 120,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 10,
    position: 'relative',
  },
  petImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
  },  addImageButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  addImageButtonDisabled: {
    borderColor: '#CCC',
    backgroundColor: '#F5F5F5',
  },
  addImageText: {
    color: '#2196F3',
    marginTop: 5,
    fontSize: 13,
    fontWeight: '600',
  },
  addImageTextDisabled: {
    color: '#CCC',
  },
  addImageSubtext: {
    color: '#2196F3',
    fontSize: 11,
    marginTop: 2,
  },
  compressionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  compressionText: {
    marginLeft: 10,
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  compressedBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    padding: 2,
  },
  imageInfo: {
    backgroundColor: '#F0F7FF',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  imageInfoText: {
    color: '#1976D2',
    fontSize: 12,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 15,
    color: '#555',
    marginBottom: 5,
    fontWeight: '500',
  },  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    height: 46,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#333',
  },
  datePickerButton: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    height: 46,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerText: {
    fontSize: 15,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    overflow: 'hidden',
  },
  segmentButton: {
    flex: 1,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#FF6B6B',
  },
  segmentText: {
    color: '#666',
    fontWeight: '500',
  },  segmentActiveText: {
    color: 'white',
  },
  pickerContainer: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 46,
    width: '100%',
    color: '#333',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  switchLabel: {
    fontSize: 15,
    color: '#555',
  },
  submitButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#FFB6B6',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  notTutorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  notTutorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
    lineHeight: 24,
  },
  becomeTutorButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  becomeTutorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddPetScreen;
