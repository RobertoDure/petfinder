import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import PetService from '../services/PetService';
import FavoritesService from '../services/FavoritesService';
import PetSwipeCard from '../components/PetSwipeCard';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);
  
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    type: null, // "DOG" or "CAT"
    gender: null, // "MALE", "FEMALE", "UNKNOWN"
    vaccinated: null, // true or false
    neutered: null, // true or false
    specialNeeds: null, // true or false
  });
  
  // Load pets on component mount
  useEffect(() => {
    fetchPets();
  }, []);
  
  const fetchPets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all available pets
      const availablePets = await PetService.getPetsByStatus('AVAILABLE');
      
      // Apply filters
      let filteredPets = availablePets;
      
      if (filters.type) {
        filteredPets = filteredPets.filter(pet => pet.type === filters.type);
      }
      
      if (filters.gender) {
        filteredPets = filteredPets.filter(pet => pet.gender === filters.gender);
      }
      
      if (filters.vaccinated !== null) {
        filteredPets = filteredPets.filter(pet => pet.vaccinated === filters.vaccinated);
      }
      
      if (filters.neutered !== null) {
        filteredPets = filteredPets.filter(pet => pet.neutered === filters.neutered);
      }
      
      if (filters.specialNeeds !== null) {
        filteredPets = filteredPets.filter(pet => pet.specialNeeds === filters.specialNeeds);
      }
      
      setPets(filteredPets);
    } catch (err) {
      console.error('Failed to fetch pets:', err);
      setError('Failed to load pets. Please try again.');
    } finally {
      setLoading(false);
    }
  };
    const handleSwipeLeft = (pet) => {
    console.log('Swiped left (rejected) pet:', pet.name);
    // Here you could add logic to ensure this pet doesn't show up again
    // For now, we just log the action
  };
  
  const handleSwipeRight = async (pet) => {
    console.log('Swiped right (liked) pet:', pet.name);
    // Add pet to favorites when swiped right
    try {
      const success = await FavoritesService.addFavorite(pet.id);
      if (success) {
        console.log(`Pet ${pet.name} added to favorites successfully`);
      } else {
        console.error(`Failed to add pet ${pet.name} to favorites`);
      }
    } catch (error) {
      console.error('Error adding pet to favorites:', error);
    }
  };
  
  const handleCardPress = (pet) => {
    navigation.navigate('PetDetail', { pet });
  };
  
  const applyFilters = () => {
    setFilterModalVisible(false);
    fetchPets();
  };
  
  const resetFilters = () => {
    setFilters({
      type: null,
      gender: null,
      vaccinated: null,
      neutered: null,
      specialNeeds: null,
    });
  };

  const FilterButton = ({ label, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.activeFilterButton]}
      onPress={onPress}
    >
      <Text style={[styles.filterButtonText, isActive && styles.activeFilterButtonText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi, {userInfo?.fullName || userInfo?.username || 'there'}!</Text>
        <Text style={styles.headerTitle}>Find your perfect pet</Text>
      </View>
      
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="filter" size={18} color="#666" />
          <Text style={styles.filterText}>Filters</Text>
        </TouchableOpacity>
        
        {Object.values(filters).some(value => value !== null) && (
          <TouchableOpacity 
            style={styles.clearFiltersButton}
            onPress={() => {
              resetFilters();
              setTimeout(() => fetchPets(), 100);
            }}
          >
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Finding pets...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchPets}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <PetSwipeCard
          pets={pets}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onCardPress={handleCardPress}
        />
      )}
      
      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Pets</Text>
              <TouchableOpacity 
                onPress={() => setFilterModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.filterSectionTitle}>Pet Type</Text>
              <View style={styles.filterButtonGroup}>
                <FilterButton
                  label="Dogs"
                  isActive={filters.type === 'DOG'}
                  onPress={() => setFilters(prev => ({...prev, type: prev.type === 'DOG' ? null : 'DOG'}))}
                />
                <FilterButton
                  label="Cats"
                  isActive={filters.type === 'CAT'}
                  onPress={() => setFilters(prev => ({...prev, type: prev.type === 'CAT' ? null : 'CAT'}))}
                />
              </View>
              
              <Text style={styles.filterSectionTitle}>Gender</Text>
              <View style={styles.filterButtonGroup}>
                <FilterButton
                  label="Male"
                  isActive={filters.gender === 'MALE'}
                  onPress={() => setFilters(prev => ({...prev, gender: prev.gender === 'MALE' ? null : 'MALE'}))}
                />
                <FilterButton
                  label="Female"
                  isActive={filters.gender === 'FEMALE'}
                  onPress={() => setFilters(prev => ({...prev, gender: prev.gender === 'FEMALE' ? null : 'FEMALE'}))}
                />
              </View>
              
              <Text style={styles.filterSectionTitle}>Health</Text>
              <View style={styles.filterButtonGroup}>
                <FilterButton
                  label="Vaccinated"
                  isActive={filters.vaccinated === true}
                  onPress={() => setFilters(prev => ({...prev, vaccinated: prev.vaccinated === true ? null : true}))}
                />
                <FilterButton
                  label="Neutered"
                  isActive={filters.neutered === true}
                  onPress={() => setFilters(prev => ({...prev, neutered: prev.neutered === true ? null : true}))}
                />
              </View>
              
              <Text style={styles.filterSectionTitle}>Special Needs</Text>
              <View style={styles.filterButtonGroup}>
                <FilterButton
                  label="Has Special Needs"
                  isActive={filters.specialNeeds === true}
                  onPress={() => setFilters(prev => ({...prev, specialNeeds: prev.specialNeeds === true ? null : true}))}
                />
                <FilterButton
                  label="No Special Needs"
                  isActive={filters.specialNeeds === false}
                  onPress={() => setFilters(prev => ({...prev, specialNeeds: prev.specialNeeds === false ? null : false}))}
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  resetFilters();
                }}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FF',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  filterText: {
    marginLeft: 5,
    color: '#666',
    fontWeight: '500',
  },
  clearFiltersButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearFiltersText: {
    color: '#FF6B6B',
    fontWeight: '500',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 30,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalScrollView: {
    maxHeight: '80%',
    paddingHorizontal: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  filterButtonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    marginBottom: 10,
  },
  activeFilterButton: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  filterButtonText: {
    color: '#666',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  resetButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
  },
  resetButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  applyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default HomeScreen;
