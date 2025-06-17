import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, Platform } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { Ionicons } from '@expo/vector-icons';
import FavoritesService from '../services/FavoritesService';
import apiClient from '../services/apiClient'; // Adjust the import path as necessary

const { width, height } = Dimensions.get('window');

const PetSwipeCard = ({ pets, onSwipeLeft, onSwipeRight, onCardPress }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [favoritedPets, setFavoritedPets] = useState(new Set());
  const [swipeLoading, setSwipeLoading] = useState(false);

  // Load favorited pets when component mounts or pets change
  useEffect(() => {
    loadFavoritedPets();
  }, [pets]);

  const loadFavoritedPets = async () => {
    try {
      const favoriteIds = await FavoritesService.getFavoriteIds();
      setFavoritedPets(new Set(favoriteIds.map(id => String(id))));
    } catch (error) {
      console.error('Error loading favorited pets:', error);
    }
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
  // Reset image index when the card changes
  const handleSwiped = (cardIndex) => {
    setCurrentCardIndex(cardIndex + 1);
    setCurrentImageIndex(0);
    setSwipeLoading(false);
  };

  // Enhanced swipe handlers with AsyncStorage integration
  const handleSwipeLeft = async (cardIndex) => {
    const pet = pets[cardIndex];
    console.log('Swiped left (rejected) pet:', pet.name);
    handleSwiped(cardIndex);
    if (onSwipeLeft) {
      onSwipeLeft(pet);
    }
  };

  const handleSwipeRight = async (cardIndex) => {
    const pet = pets[cardIndex];
    setSwipeLoading(true);
    
    console.log('Swiped right (liked) pet:', pet.name);
    
    try {
      // Add to favorites using AsyncStorage
      const success = await FavoritesService.addFavorite(pet.id);
      if (success) {
        // Update local state to reflect the change
        setFavoritedPets(prev => new Set([...prev, String(pet.id)]));
        console.log(`Pet ${pet.name} added to favorites successfully`);
      } else {
        console.error(`Failed to add pet ${pet.name} to favorites`);
      }
    } catch (error) {
      console.error('Error adding pet to favorites:', error);
    }
    
    handleSwiped(cardIndex);
    if (onSwipeRight) {
      onSwipeRight(pet);
    }
  };
  const renderCard = (pet) => {
    if (!pet) return null;
    
    const isFavorited = favoritedPets.has(String(pet.id));
    
    // Configure API URL based on platform and environment
    const getApiUrl = () => {
      if (__DEV__) {
        // Development environment
        if (Platform.OS === 'android') {
          // Android emulator uses 10.0.2.2 to access host machine's localhost
          return 'http://192.168.0.139:8080/api/pets/images/';
        } else {
          // iOS simulator can use localhost
          return 'http://localhost:8080/api/pets/images/';
        }
      }
      // Production environment - replace with your actual API URL
      return 'https://your-production-api.com/api/pets/images/';
    };
    
    const API_URL = getApiUrl();
    const cardImage = pet.images && pet.images.length > 0
      ? { uri: `http://192.168.0.139:8080/api/pets/images/${pet.images[currentImageIndex].id}` }
      : require('../assets/pet1.jpg'); // Fallback image

    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => onCardPress(pet)}
        style={styles.card}
      >
        <View style={styles.imageContainer}>
          <Image source={cardImage} style={styles.cardImage} />

          {/* Favorite indicator */}
          {isFavorited && (
            <View style={styles.favoriteIndicator}>
              <Ionicons name="heart" size={20} color="#FF4949" />
            </View>
          )}

          {pet.images && pet.images.length > 1 && (
            <View style={styles.imageNavigationContainer}>
              <TouchableOpacity 
                onPress={() => cycleImages(pet, 'prev')}
                style={[styles.imageNavButton, styles.leftButton]}
              >
                <Ionicons name="chevron-back" size={28} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => cycleImages(pet, 'next')}
                style={[styles.imageNavButton, styles.rightButton]}
              >
                <Ionicons name="chevron-forward" size={28} color="white" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.imageCounter}>
            {pet.images && pet.images.length > 1 && pet.images.map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.dot, 
                  currentImageIndex === index && styles.activeDot
                ]} 
              />
            ))}
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.header}>
            <Text style={styles.name}>{pet.name}</Text>
            <View style={styles.ageBreedRow}>
              <Text style={styles.age}>
                {pet.birthDate ? calculateAge(pet.birthDate) : 'Age unknown'}
              </Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.breed}>{pet.breed || 'Unknown breed'}</Text>
            </View>
          </View>

          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.location}>
              {pet.location?.city || 'Unknown location'}
            </Text>
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
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {pets.length > 0 ? (        <Swiper
          cards={pets}
          renderCard={renderCard}
          onSwiped={handleSwiped}
          onSwipedLeft={handleSwipeLeft}
          onSwipedRight={handleSwipeRight}
          cardIndex={0}
          backgroundColor={'#F5F8FF'}
          stackSize={2}
          stackSeparation={14}
          animateCardOpacity
          verticalSwipe={false}
          cardVerticalMargin={0}
          cardHorizontalMargin={0}
          containerStyle={styles.swiperContainer}
          overlayLabels={{
            left: {
              title: 'NOPE',
              style: {
                label: {
                  backgroundColor: '#FF4949',
                  color: 'white',
                  fontSize: 24,
                  borderRadius: 10,
                  padding: 10,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-start',
                  marginTop: 30,
                  marginLeft: -30,
                }
              }
            },
            right: {
              title: swipeLoading ? 'SAVING...' : 'LIKE',
              style: {
                label: {
                  backgroundColor: swipeLoading ? '#FFA726' : '#4CCC93',
                  color: 'white',
                  fontSize: 24,
                  borderRadius: 10,
                  padding: 10,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  marginTop: 30,
                  marginLeft: 30,
                }
              }
            }
          }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="paw" size={70} color="#CCCCCC" />
          <Text style={styles.emptyText}>No pets found</Text>
          <Text style={styles.emptySubtext}>Try changing your search criteria</Text>
        </View>
      )}

      {pets.length > 0 && (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.nopeButton]}
            onPress={() => {
              if (currentCardIndex < pets.length) {
                swiper?.swipeLeft();
              }
            }}
          >
            <Ionicons name="close" size={30} color="#FF4949" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.likeButton]}
            onPress={() => {
              if (currentCardIndex < pets.length) {
                swiper?.swipeRight();
              }
            }}
          >
            <Ionicons name="heart" size={30} color="#4CCC93" />
          </TouchableOpacity>
        </View>
      )}
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
  swiperContainer: {
    flex: 1,
  },
  card: {
    height: height * 0.7,
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
  },
  imageContainer: {
    height: '65%',
    width: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
  dot: {
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
    padding: 15,
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
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
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
