import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  useDerivedValue
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Ionicons } from '@expo/vector-icons';
import FavoritesService from '../services/FavoritesService';
import ImagesService from '../services/ImagesService';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = height * 0.7;

const PetSwipeCard = ({ pets, onSwipeLeft, onSwipeRight, onCardPress }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [favoritedPets, setFavoritedPets] = useState(new Set());
  const [swipeLoading, setSwipeLoading] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState(new Map());
  const [isPreloading, setIsPreloading] = useState(false);

  // Constants for preloading
  const CARDS_TO_PRELOAD = 5;
  const CARDS_TO_SHOW_BEHIND = 3;

  // Animated values for gestures
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  // Load favorited pets when component mounts or pets change.
  // preloadImages is intentionally NOT called here; the [currentCardIndex] effect handles it.
  useEffect(() => {
    loadFavoritedPets();
  }, [pets]);

  // Preload images when currentCardIndex changes (covers initial load too)
  useEffect(() => {
    preloadImages();
  }, [currentCardIndex]);

  // Reset animation values when card changes
  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    scale.value = 1;
    rotate.value = 0;
  }, [currentCardIndex]);

  const loadFavoritedPets = async () => {
    try {
      const favoriteIds = await FavoritesService.getFavoriteIds();
      setFavoritedPets(new Set(favoriteIds.map(id => String(id))));
    } catch (error) {
      console.error('Error loading favorited pets:', error);
    }
  };
  // Preload images for next cards
  const preloadImages = async () => {
    if (isPreloading || pets.length === 0) return;

    setIsPreloading(true);
    const newPreloadedImages = new Map();

    try {
      // Clean up old images that are no longer needed
      const currentImageKeys = new Set();

      // Preload current card and next CARDS_TO_PRELOAD cards
      const startIndex = Math.max(0, currentCardIndex - 1); // Keep one previous card
      const endIndex = Math.min(currentCardIndex + CARDS_TO_PRELOAD, pets.length);

      for (let i = startIndex; i < endIndex; i++) {
        const pet = pets[i];
        if (!pet || !pet.images || pet.images.length === 0) continue;

        // Preload all images for this pet
        for (const imageData of pet.images) {
          const imageKey = `${pet.id}-${imageData.id}`;
          currentImageKeys.add(imageKey);

          // Keep existing preloaded image if available
          if (preloadedImages.has(imageKey)) {
            newPreloadedImages.set(imageKey, preloadedImages.get(imageKey));
          } else {
            const imageUri = ImagesService.getImageUri(imageData.id);

            newPreloadedImages.set(imageKey, {
              uri: imageUri,
              loaded: false});
            Image.prefetch(imageUri)
              .then(() => {
                if (newPreloadedImages.has(imageKey)) {
                  newPreloadedImages.set(imageKey, {
                    uri: imageUri,
                    loaded: true
                  });
                  setPreloadedImages(new Map(newPreloadedImages));
                }
              })
              .catch((error) => {
                console.warn(`Failed to prefetch image ${imageKey}:`, error);
              });
          }
        }
      }

      setPreloadedImages(newPreloadedImages);
    } catch (error) {
      console.error('Error preloading images:', error);
    } finally {
      setIsPreloading(false);
    }
  };// Get preloaded image URI or fallback
  const getImageSource = (pet, imageIndex = 0) => {
    if (!pet.images || pet.images.length === 0) {
      return require('../assets/pet1.jpg');
    }

    const imageData = pet.images[imageIndex];
    const imageKey = `${pet.id}-${imageData.id}`;
    const preloadedImage = preloadedImages.get(imageKey);

    if (preloadedImage) {
      return { uri: preloadedImage.uri };
    }

    // Fallback to direct URI if not preloaded
    return { uri: ImagesService.getImageUri(imageData.id) };
  };

  // Function to handle image cycling within a card
  const cycleImages = (pet, direction) => {
    if (!pet.images || pet.images.length <= 1) return;

    if (direction === 'next') {
      setCurrentImageIndex((prev) =>
        prev === pet.images.length - 1 ? 0 : prev + 1
      );
    } else {
      setCurrentImageIndex((prev) =>
        prev === 0 ? pet.images.length - 1 : prev - 1
      );
    }
  };

  // Handle card swiped
  const handleCardSwiped = (direction) => {
    const pet = pets[currentCardIndex];
    if (!pet) return;

    if (direction === 'left') {
      if (onSwipeLeft) onSwipeLeft(pet);
    } else if (direction === 'right') {
      handleSwipeRight(pet);
    }

    // Move to next card
    setCurrentCardIndex(prev => prev + 1);
    setCurrentImageIndex(0);
  };

  // Enhanced swipe handlers with AsyncStorage integration
  const handleSwipeRight = async (pet) => {
    setSwipeLoading(true);

    try {
      const success = await FavoritesService.addFavorite(pet.id);
      if (success) {
        setFavoritedPets(prev => new Set([...prev, String(pet.id)]));
      }
    } catch {
      // Swipe-to-favourite failure is silent; user can retry from detail screen
    } finally {
      setSwipeLoading(false);
    }

    if (onSwipeRight) {
      onSwipeRight(pet);
    }
  };

  // Programmatic swipe functions
  const swipeLeft = () => {
    translateX.value = withSpring(-width * 1.5, { damping: 15 }, () => {
      scheduleOnRN(handleCardSwiped, 'left');
      translateX.value = 0;
    });
  };

  const swipeRight = () => {
    translateX.value = withSpring(width * 1.5, { damping: 15 }, () => {
      scheduleOnRN(handleCardSwiped, 'right');
      translateX.value = 0;
    });
  };

  // Pan gesture
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;

      // Calculate rotation based on horizontal movement
      rotate.value = interpolate(
        event.translationX,
        [-width / 2, 0, width / 2],
        [-10, 0, 10],
        Extrapolation.CLAMP
      );

      // Slightly scale down when dragging
      scale.value = interpolate(
        Math.abs(event.translationX),
        [0, width / 2],
        [1, 0.95],
        Extrapolation.CLAMP
      );
    })
    .onEnd((event) => {
      const shouldSwipeLeft = event.translationX < -SWIPE_THRESHOLD;
      const shouldSwipeRight = event.translationX > SWIPE_THRESHOLD;

      if (shouldSwipeLeft) {
        translateX.value = withSpring(-width * 1.5, { damping: 15 }, () => {
          scheduleOnRN(handleCardSwiped, 'left');
          translateX.value = 0;
          translateY.value = 0;
          rotate.value = 0;
          scale.value = 1;
        });
      } else if (shouldSwipeRight) {
        translateX.value = withSpring(width * 1.5, { damping: 15 }, () => {
          scheduleOnRN(handleCardSwiped, 'right');
          translateX.value = 0;
          translateY.value = 0;
          rotate.value = 0;
          scale.value = 1;
        });
      } else {
        // Return to center
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotate.value = withSpring(0);
        scale.value = withSpring(1);
      }
    });

  // Animated style for the current card
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  // Opacity for overlay labels
  const leftOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, -50, 0],
      [1, 0.6, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const rightOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, 50, SWIPE_THRESHOLD],
      [0, 0.6, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  }); 
  
  const renderCard = (pet, index, isBackground = false) => {
    if (!pet) return null;

    const isFavorited = favoritedPets.has(String(pet.id));
    const cardImageIndex = isBackground ? 0 : currentImageIndex;
    const cardImage = getImageSource(pet, cardImageIndex);

    const CardComponent = isBackground ? View : Animated.View;
    const cardStyle = isBackground
      ? [styles.card, styles.backgroundCard]
      : [styles.card, animatedCardStyle];

    const content = (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => !isBackground && onCardPress(pet)}
        style={styles.cardTouchable}
        disabled={isBackground}>
        <View style={styles.imageContainer}>
          <Image
            source={cardImage}
            style={styles.cardImage}
            defaultSource={require('../assets/pet1.jpg')}
            fadeDuration={isBackground ? 0 : 300} />
          {!isBackground && (
            <>
              {/* Swipe Overlays */}
              <Animated.View style={[styles.swipeOverlay, styles.rejectOverlay, leftOverlayStyle]}>
                <Text style={styles.swipeText}>NOPE</Text>
              </Animated.View>
              <Animated.View style={[styles.swipeOverlay, styles.likeOverlay, rightOverlayStyle]}>
                <Text style={styles.swipeText}>{swipeLoading ? 'SAVING...' : 'LIKE'}</Text>
              </Animated.View>
              {isFavorited && (
                <View style={styles.favoriteIndicator}>
                  <Ionicons name="heart" size={20} color="#FF4949" />
                </View>
              )}
              {/* Image Navigation */}
              {pet.images && pet.images.length > 1 && (
                <View style={styles.imageNavigationContainer}>
                  <TouchableOpacity
                    onPress={() => cycleImages(pet, 'prev')}
                    style={[styles.imageNavButton, styles.leftButton]}>
                    <Ionicons name="chevron-back" size={28} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => cycleImages(pet, 'next')}
                    style={[styles.imageNavButton, styles.rightButton]}>
                    <Ionicons name="chevron-forward" size={28} color="white" />
                  </TouchableOpacity>
                </View>
              )}  
              <View style={styles.imageCounter}>
                {pet.images && pet.images.length > 1 && pet.images.map((_, imageIndex) => (
                  <View
                    key={imageIndex}
                    style={[
                      styles.dot,
                      currentImageIndex === imageIndex && styles.activeDot
                    ]}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.cardContent}>       
          <View style={styles.header}>
          <Text style={styles.name}>{pet.name}</Text>
          {!isBackground && (
            <View style={styles.ageBreedRow}>
              <Text style={styles.age}>{pet.birthDate ? calculateAge(pet.birthDate) : 'Age unknown'}</Text>
              <Text style={styles.dotText}>•</Text>
              <Text style={styles.breed}>{pet.breed || 'Unknown breed'}</Text>
            </View>
          )}
        </View>          
        {!isBackground && (
          <>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={16} color="#666" />
              <Text style={styles.location}>{pet.location?.city || 'Unknown location'}</Text>
            </View>

            <View style={styles.tags}>
              {pet.vaccinated && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Vaccinated</Text>
                </View>
              )}
              {pet.neutered && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Neutered</Text>
                </View>
              )}
              {pet.specialNeeds && (
                <View style={[styles.tag, styles.specialNeedsTag]}>
                  <Text style={styles.tagText}>Special Needs</Text>
                </View>
              )}
            </View>
          </>
        )}
        </View>
      </TouchableOpacity>
    );    if (isBackground) {
      return (
        <View key={`background-${pet.id}-${index}`} style={cardStyle}>
          {content}
        </View>
      );
    }

    return (
      <GestureDetector gesture={panGesture} key={`current-${pet.id}-${index}`}>
        <CardComponent style={cardStyle}>{content}</CardComponent>
      </GestureDetector>
    );

  };
  
  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        {pets.length > 0 ? (          <>
            {/* Stack effect - show background cards with proper preloading */}
            {pets.slice(currentCardIndex + 1, currentCardIndex + 1 + CARDS_TO_SHOW_BEHIND).map((pet, index) => {
                const backgroundCardStyle = {
                  transform: [
                    { scale: 1 - (index + 1) * 0.03 },
                    { translateY: (index + 1) * 8 }
                  ],
                  zIndex: -(index + 1),
                  opacity: 1 - (index * 0.2)
                };
                
                return (
                  <View
                    key={`background-${pet.id}-${currentCardIndex}-${index}`}
                    style={[styles.card, styles.backgroundCard, backgroundCardStyle]}
                  >                  
                    <View style={styles.imageContainer}>
                      <Image
                        source={getImageSource(pet, 0)}
                        style={styles.cardImage}
                        defaultSource={require('../assets/pet1.jpg')}
                        fadeDuration={100}
                      />
                    </View>
                    <View style={styles.cardContent}>
                      <View style={styles.header}>
                        <Text style={styles.name}>{pet.name}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            }
            {/* Current card */}
            {pets[currentCardIndex] && renderCard(pets[currentCardIndex], currentCardIndex, false)}

            {/* Action buttons */}
            {/* <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.nopeButton]}
                onPress={swipeLeft}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={30} color="#FF4949" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.likeButton]}
                onPress={swipeRight}
                activeOpacity={0.8}
              >
                <Ionicons name="heart" size={30} color="#4CCC93" />
              </TouchableOpacity>
            </View> */}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="paw" size={70} color="#CCCCCC" />
            <Text style={styles.emptyText}>No pets found</Text>
            <Text style={styles.emptySubtext}>Try changing your search criteria</Text>
          </View>)}
      </View>
    </View>
  );
};

// Helper function to calculate age from birthdate
const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);

  let years = today.getFullYear() - birth.getFullYear();
  const months = today.getMonth() - birth.getMonth();

  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
    years--;
  }

  if (years === 0) {
    const monthsDiff = (today.getMonth() + 12) - birth.getMonth();
    return `${monthsDiff} months`;
  }

  return `${years} ${years === 1 ? 'year' : 'years'}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FF',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
    position: 'absolute',
  }, backgroundCard: {
    opacity: 0.9,
  },
  cardTouchable: {
    flex: 1,
  },
  imageContainer: {
    height: '65%',
    width: '100%',
    position: 'relative',
  }, cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  swipeOverlay: {
    position: 'absolute',
    top: 50,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 10,
  },
  rejectOverlay: {
    right: 30,
    backgroundColor: '#FF4949',
    borderWidth: 3,
    borderColor: '#FF4949',
  },
  likeOverlay: {
    left: 30,
    backgroundColor: '#4CCC93',
    borderWidth: 3,
    borderColor: '#4CCC93',
  },
  swipeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  favoriteIndicator: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    zIndex: 5,
  },
  imageNavigationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  imageNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftButton: {
    marginLeft: 10,
  },
  rightButton: {
    marginRight: 10,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    margin: 3,
  },
  activeDot: {
    backgroundColor: 'white',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardContent: {
    padding: 20,
    flex: 1,
  },
  header: {
    marginBottom: 10,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  ageBreedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  age: {
    fontSize: 16,
    color: '#666',
  },
  dotText: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 6,
  },
  breed: {
    fontSize: 16,
    color: '#666',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  specialNeedsTag: {
    backgroundColor: '#FFE8E8',
  },
  tagText: {
    fontSize: 12,
    color: '#555',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    paddingHorizontal: 60,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  likeButton: {
    borderWidth: 2,
    borderColor: '#4CCC93',
  },
  nopeButton: {
    borderWidth: 2,
    borderColor: '#FF4949',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#AAAAAA',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default PetSwipeCard;
