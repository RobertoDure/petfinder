import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
//import MapView, { Marker } from 'react-native-maps';
import PetService from '../services/PetService';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const PetDetailScreen = ({ route, navigation }) => {
  const { pet: initialPetData } = route.params;
  const { logout } = useContext(AuthContext);
  
  const [pet, setPet] = useState(initialPetData);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  
  useEffect(() => {
    // Set up navigation header with logout button
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 16 }}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      ),
    });
    
    // Fetch complete pet details
    const fetchPetDetails = async () => {
      try {
        const petDetails = await PetService.getPetById(initialPetData.id);
        setPet(petDetails);
      } catch (error) {
        console.error('Error fetching pet details:', error);
        // Use initial pet data if fetch fails
      } finally {
        setLoading(false);
      }
    };
    
    fetchPetDetails();
    
    // Check if pet is in favorites
    // This would be implemented with a FavoriteService
    // setIsFavorite(FavoriteService.isPetFavorite(initialPetData.id));
  }, [initialPetData.id]);
  
  const handleAdoptRequest = () => {
    Alert.alert(
      "Request Adoption",
      `Would you like to contact ${pet.tutor.name} about adopting ${pet.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Yes", 
          onPress: () => {
            // In a real app, this would send a request to the tutor
            // or open a chat between the user and the tutor
            Alert.alert(
              "Adoption Request Sent",
              `Your interest in adopting ${pet.name} has been sent to ${pet.tutor.name}. They will contact you soon!`
            );
          }
        }
      ]
    );
  };
  
  const handleToggleFavorite = () => {
    // Toggle favorite status
    setIsFavorite(!isFavorite);
    
    // In a real app, this would call a FavoriteService
    // if (isFavorite) {
    //   FavoriteService.removeFavorite(pet.id);
    // } else {
    //   FavoriteService.addFavorite(pet.id);
    // }
  };
  
  const handleContactTutor = () => {
    // In a real app, this would open a chat with the tutor
    // or prompt to call/email the tutor
    if (pet.tutor && pet.tutor.email) {
      Linking.openURL(`mailto:${pet.tutor.email}?subject=Regarding ${pet.name} on PetFinder`);
    } else {
      Alert.alert("Contact Information", "Tutor contact information is not available.");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          onPress: () => logout() 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading pet details...</Text>
      </View>
    );
  }

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        {pet.images && pet.images.length > 0 ? (
          <>
            <Image
              source={{ uri: `http://192.168.0.139:8080/api/pets/images/${pet.images[currentImageIndex].id}` }}
              style={styles.image}
              resizeMode="cover"
            />
            
            {pet.images.length > 1 && (
              <>
                <View style={styles.imageNavigation}>
                  <TouchableOpacity 
                    style={styles.navButton}
                    onPress={() => setCurrentImageIndex(prev => 
                      prev === 0 ? pet.images.length - 1 : prev - 1
                    )}
                  >
                    <Ionicons name="chevron-back" size={24} color="white" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.navButton}
                    onPress={() => setCurrentImageIndex(prev => 
                      prev === pet.images.length - 1 ? 0 : prev + 1
                    )}
                  >
                    <Ionicons name="chevron-forward" size={24} color="white" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.imagePagination}>
                  {pet.images.map((_, index) => (
                    <View 
                      key={index}
                      style={[
                        styles.paginationDot,
                        currentImageIndex === index && styles.activeDot
                      ]}
                    />
                  ))}
                </View>
              </>
            )}
          </>
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Ionicons name="paw" size={60} color="#CCCCCC" />
            <Text style={styles.noImageText}>No images available</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={handleToggleFavorite}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={26} 
            color={isFavorite ? "#FF6B6B" : "white"} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerSection}>
          <View>
            <Text style={styles.petName}>{pet.name}</Text>
            <View style={styles.petInfoRow}>
              <Text style={styles.petInfo}>
                {pet.type} • {pet.breed} • {pet.gender}
              </Text>
            </View>
          </View>
          
          <View style={[styles.statusBadge, 
            pet.status === 'AVAILABLE' 
              ? styles.availableBadge 
              : pet.status === 'PENDING' 
                ? styles.pendingBadge 
                : styles.adoptedBadge
          ]}>
            <Text style={styles.statusText}>
              {pet.status === 'AVAILABLE' 
                ? 'Available' 
                : pet.status === 'PENDING' 
                  ? 'Pending' 
                  : 'Adopted'}
            </Text>
          </View>
        </View>
        
        <View style={styles.locationSection}>
          <Ionicons name="location-outline" size={18} color="#666" />
          <Text style={styles.locationText}>
            {pet.location ? `${pet.location.city}, ${pet.location.state}` : 'Location unknown'}
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{pet.description || 'No description provided'}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Age</Text>
              <Text style={styles.detailValue}>
                {pet.birthDate ? calculateAge(pet.birthDate) : 'Unknown'}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Size</Text>
              <Text style={styles.detailValue}>{pet.size || 'Unknown'}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Color</Text>
              <Text style={styles.detailValue}>{pet.color || 'Unknown'}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Weight</Text>
              <Text style={styles.detailValue}>
                {pet.weight ? `${pet.weight} kg` : 'Unknown'}
              </Text>
            </View>
          </View>
          
          <View style={styles.healthSection}>
            <View style={styles.healthItem}>
              <Ionicons 
                name={pet.vaccinated ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={pet.vaccinated ? "#4CCC93" : "#FF6B6B"} 
              />
              <Text style={styles.healthText}>Vaccinated</Text>
            </View>
            
            <View style={styles.healthItem}>
              <Ionicons 
                name={pet.neutered ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={pet.neutered ? "#4CCC93" : "#FF6B6B"} 
              />
              <Text style={styles.healthText}>Neutered/Spayed</Text>
            </View>
            
            {pet.specialNeeds && (
              <View style={styles.specialNeedsItem}>
                <Ionicons name="alert-circle" size={20} color="#FF9500" />
                <View>
                  <Text style={styles.specialNeedsText}>Special Needs</Text>
                  {pet.specialNeedsDescription && (
                    <Text style={styles.specialNeedsDesc}>{pet.specialNeedsDescription}</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
        
        {pet.tutor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tutor Information</Text>
            
            <View style={styles.tutorCard}>
              <View style={styles.tutorAvatar}>
                <Ionicons name="person" size={30} color="#666" />
              </View>
              
              <View style={styles.tutorInfo}>
                <Text style={styles.tutorName}>{pet.tutor.name}</Text>
                <Text style={styles.tutorType}>
                  {pet.tutor.type === 'INDIVIDUAL' ? 'Individual' : 
                   pet.tutor.type === 'ORGANIZATION' ? 'Organization' : 'Shelter'}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleContactTutor}
              >
                <Text style={styles.contactButtonText}>Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* {pet.location && pet.location.latitude && pet.location.longitude && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: pet.location.latitude,
                longitude: pet.location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: pet.location.latitude,
                  longitude: pet.location.longitude,
                }}
                title={pet.name}
                description={`${pet.type} - ${pet.breed}`}
              />
            </MapView>
          </View>
        )} */}
        
        {pet.status === 'AVAILABLE' && (
          <TouchableOpacity
            style={styles.adoptButton}
            onPress={handleAdoptRequest}
          >
            <Text style={styles.adoptButtonText}>Request to Adopt</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#999',
    marginTop: 10,
    fontSize: 16,
  },
  imageNavigation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePagination: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: 'white',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  favoriteButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 20,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  petName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  petInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  petInfo: {
    fontSize: 16,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  availableBadge: {
    backgroundColor: '#E1F5E9',
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
  },
  adoptedBadge: {
    backgroundColor: '#E0F2F7',
  },
  statusText: {
    fontWeight: '600',
    fontSize: 14,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationText: {
    color: '#666',
    marginLeft: 5,
    fontSize: 15,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  detailItem: {
    width: '50%',
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
    color: '#999',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginTop: 3,
  },
  healthSection: {
    marginTop: 5,
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  healthText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#444',
  },
  specialNeedsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 5,
    backgroundColor: '#FFFAF0',
    padding: 12,
    borderRadius: 10,
  },
  specialNeedsText: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '500',
    color: '#444',
  },
  specialNeedsDesc: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  tutorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tutorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorInfo: {
    flex: 1,
    marginLeft: 15,
  },
  tutorName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  tutorType: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  contactButton: {
    backgroundColor: '#F0F2F5',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  contactButtonText: {
    color: '#444',
    fontWeight: '500',
  },
  map: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  adoptButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  adoptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PetDetailScreen;
