import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { runOnJS } from 'react-native-worklets';
import { Ionicons } from '@expo/vector-icons';
import FavoritesService from '../services/FavoritesService';
import ImagesService from '../services/ImagesService';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = height * 0.7;

const PetSwipeCard = ({ pets, onSwipeLeft, onSwipeRight, onCardPress, onNeedMore, isFetchingMore }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [favoritedPets, setFavoritedPets] = useState(new Set());
  const [swipeLoading, setSwipeLoading] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState(new Map());
  // Use a ref instead of state so the guard flag doesn't trigger extra renders.
  const isPreloadingRef = useRef(false);

  // Constants for preloading
  const CARDS_TO_PRELOAD = 5;
  const CARDS_TO_SHOW_BEHIND = 3;

  // Animated values for the front (draggable) card
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  // Animated values for the exit card (flies off after index is already advanced)
  const exitTranslateX = useSharedValue(0);
  const exitTranslateY = useSharedValue(0);
  const exitRotate = useSharedValue(0);

  // The pet card currently flying off screen
  const [exitingCard, setExitingCard] = useState(null);
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
    if (isPreloadingRef.current || pets.length === 0) return;

    isPreloadingRef.current = true;
    const newPreloadedImages = new Map();

    try {
      // Preload current card and next CARDS_TO_PRELOAD cards
      const startIndex = Math.max(0, currentCardIndex - 1); // Keep one previous card
      const endIndex = Math.min(currentCardIndex + CARDS_TO_PRELOAD, pets.length);

      for (let i = startIndex; i < endIndex; i++) {
        const pet = pets[i];
        if (!pet || !pet.images || pet.images.length === 0) continue;

        // Preload all images for this pet
        for (const imageData of pet.images) {
          const imageKey = `${pet.id}-${imageData.id}`;

          // Keep existing preloaded image if available
          if (preloadedImages.has(imageKey)) {
            newPreloadedImages.set(imageKey, preloadedImages.get(imageKey));
          } else {
            const imageUri = ImagesService.getImageUri(imageData.id);

            newPreloadedImages.set(imageKey, { uri: imageUri, loaded: false });
            Image.prefetch(imageUri)
              .then(() => {
                if (newPreloadedImages.has(imageKey)) {
                  newPreloadedImages.set(imageKey, { uri: imageUri, loaded: true });
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
      isPreloadingRef.current = false;
    }
  };

  const getImageSource = useCallback((pet, imageIndex = 0) => {
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
  }, [preloadedImages]);

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

  // Clears the exit card once its fly-away animation finishes.
  const clearExitingCard = useCallback(() => {
    setExitingCard(null);
    exitTranslateX.value = 0;
    exitTranslateY.value = 0;
    exitRotate.value = 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Called immediately when a swipe is committed (before the exit animation ends).
  // cardIndex is passed explicitly to avoid stale closure issues from worklets.
  const commitSwipe = useCallback((direction, cardIndex) => {
    const pet = pets[cardIndex];
    if (!pet) return;

    // Show this pet as the exit card (flying away on top)
    setExitingCard(pet);

    const nextIndex = cardIndex + 1;
    setCurrentCardIndex(nextIndex);
    setCurrentImageIndex(0);

    if (direction === 'left') {
      if (onSwipeLeft) onSwipeLeft(pet);
    } else {
      handleSwipeRight(pet);
    }

    if (onNeedMore && pets.length - nextIndex <= 3) {
      onNeedMore();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pets, onSwipeLeft, onNeedMore]);

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
    const idx = currentCardIndex;
    exitTranslateX.value = 0;
    exitTranslateY.value = 0;
    exitRotate.value = -8;
    commitSwipe('left', idx);
    exitTranslateX.value = withSpring(-width * 1.5, { damping: 15 }, () => {
      runOnJS(clearExitingCard)();
    });
  };

  const swipeRight = () => {
    const idx = currentCardIndex;
    exitTranslateX.value = 0;
    exitTranslateY.value = 0;
    exitRotate.value = 8;
    commitSwipe('right', idx);
    exitTranslateX.value = withSpring(width * 1.5, { damping: 15 }, () => {
      runOnJS(clearExitingCard)();
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

      if (shouldSwipeLeft || shouldSwipeRight) {
        const direction = shouldSwipeLeft ? 'left' : 'right';
        const targetX = shouldSwipeLeft ? -width * 1.5 : width * 1.5;

        // Capture the current drag position so the exit card starts exactly
        // where the user's finger released — no jump.
        exitTranslateX.value = translateX.value;
        exitTranslateY.value = translateY.value;
        exitRotate.value = rotate.value;

        // Reset the front card immediately — new card snaps in behind the exit card
        translateX.value = 0;
        translateY.value = 0;
        rotate.value = 0;
        scale.value = 1;

        // Advance the deck index on the JS thread right now (not after animation)
        runOnJS(commitSwipe)(direction, currentCardIndex);

        // Fly the captured exit card off screen
        exitTranslateX.value = withSpring(targetX, { damping: 15 }, () => {
          runOnJS(clearExitingCard)();
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

  // Exit card animated style
  const exitAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: exitTranslateX.value },
      { translateY: exitTranslateY.value },
      { rotate: `${exitRotate.value}deg` },
    ],
  }));

  // Background card animated styles.
  // Uses the maximum of drag (translateX) and exit (exitTranslateX) progress
  // so cards keep lifting whether the user is dragging OR the exit animation is running.
  const bgCardStyle0 = useAnimatedStyle(() => {
    const progress = interpolate(
      Math.abs(translateX.value) + Math.abs(exitTranslateX.value),
      [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP
    );
    return {
      transform: [
        { scale: interpolate(progress, [0, 1], [0.97, 1.0]) },
        { translateY: interpolate(progress, [0, 1], [8, 0]) },
      ],
      opacity: 1.0,
    };
  });

  const bgCardStyle1 = useAnimatedStyle(() => {
    const progress = interpolate(
      Math.abs(translateX.value) + Math.abs(exitTranslateX.value),
      [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP
    );
    return {
      transform: [
        { scale: interpolate(progress, [0, 1], [0.94, 0.97]) },
        { translateY: interpolate(progress, [0, 1], [16, 8]) },
      ],
      opacity: interpolate(progress, [0, 1], [0.8, 1.0]),
    };
  });

  const bgCardStyle2 = useAnimatedStyle(() => {
    const progress = interpolate(
      Math.abs(translateX.value) + Math.abs(exitTranslateX.value),
      [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP
    );
    return {
      transform: [
        { scale: interpolate(progress, [0, 1], [0.91, 0.94]) },
        { translateY: interpolate(progress, [0, 1], [24, 16]) },
      ],
      opacity: interpolate(progress, [0, 1], [0.6, 0.8]),
    };
  });

  const bgAnimatedStyles = [bgCardStyle0, bgCardStyle1, bgCardStyle2];

  
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
            {/* Exit card — the pet that just got swiped, flying off above the stack */}
            {exitingCard && (
              <Animated.View
                style={[styles.card, exitAnimatedStyle, styles.exitCard]}
                pointerEvents="none"
              >
                <View style={styles.imageContainer}>
                  <Image
                    source={getImageSource(exitingCard, 0)}
                    style={styles.cardImage}
                    defaultSource={require('../assets/pet1.jpg')}
                    fadeDuration={0}
                  />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.header}>
                    <Text style={styles.name}>{exitingCard.name}</Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Stack — background cards animate toward the top as the front card is dragged */}
            {pets.slice(currentCardIndex + 1, currentCardIndex + 1 + CARDS_TO_SHOW_BEHIND).map((pet, index) => (
                <Animated.View
                  key={`background-${pet.id}-${currentCardIndex}-${index}`}
                  style={[
                    styles.card,
                    styles.backgroundCard,
                    { zIndex: -(index + 1) },
                    bgAnimatedStyles[index],
                  ]}
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
                </Animated.View>
              ))
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
          {/* Subtle indicator shown while the next batch is being fetched */}
            {isFetchingMore && (
              <View style={styles.fetchingMoreIndicator}>
                <ActivityIndicator size="small" color="#FF6B6B" />
                <Text style={styles.fetchingMoreText}>Loading more pets…</Text>
              </View>
            )}
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
  },
  backgroundCard: {},
  exitCard: {
    zIndex: 100,
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
  fetchingMoreIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  fetchingMoreText: {
    fontSize: 13,
    color: '#FF6B6B',
  },
});

export default PetSwipeCard;
