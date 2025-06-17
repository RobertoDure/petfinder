import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PetService from '../services/PetService';

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pets, setPets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  
  // Filter options
  const [selectedType, setSelectedType] = useState(null); // 'DOG' or 'CAT'
  const [selectedStatus, setSelectedStatus] = useState('AVAILABLE');
  
  useEffect(() => {
    // Load all pets on component mount
    fetchPets();
  }, []);
  
  const fetchPets = async () => {
    setLoading(true);
    try {
      const allPets = await PetService.getAllPets();
      setPets(allPets);
      filterPets(allPets, searchQuery, selectedType, selectedStatus);
    } catch (error) {
      console.error('Error fetching pets:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filterPets = (petsData, query, type, status) => {
    let filtered = [...petsData];
    
    // Filter by search query (search in name, breed, description)
    if (query) {
      filtered = filtered.filter(
        pet => 
          pet.name.toLowerCase().includes(query.toLowerCase()) ||
          (pet.breed && pet.breed.toLowerCase().includes(query.toLowerCase())) ||
          (pet.description && pet.description.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    // Filter by type
    if (type) {
      filtered = filtered.filter(pet => pet.type === type);
    }
    
    // Filter by status
    if (status) {
      filtered = filtered.filter(pet => pet.status === status);
    }
    
    setFilteredPets(filtered);
  };
  
  const handleSearch = () => {
    setSearching(true);
    filterPets(pets, searchQuery, selectedType, selectedStatus);
    setSearching(false);
  };
  
  const handleTypeFilter = (type) => {
    const newType = selectedType === type ? null : type;
    setSelectedType(newType);
    filterPets(pets, searchQuery, newType, selectedStatus);
  };
  
  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    filterPets(pets, searchQuery, selectedType, status);
  };
  
  const renderPetItem = ({ item }) => (
    <TouchableOpacity
      style={styles.petCard}
      onPress={() => navigation.navigate('PetDetail', { pet: item })}
    >
      <Image
        source={
          item.images && item.images.length > 0
            ? { uri: `http://192.168.0.139:8080/api/pets/images/${item.images[0].id}` }
            : require('../assets/pet-placeholder.png')
        }
        style={styles.petImage}
        resizeMode="cover"
      />
      
      <View style={styles.petInfo}>
        <Text style={styles.petName}>{item.name}</Text>
        <View style={styles.petDetails}>
          <Text style={styles.petBreed}>{item.breed}</Text>
          {item.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={12} color="#666" />
              <Text style={styles.locationText}>
                {item.location.city}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.tagsContainer}>
          <View style={[styles.tag, { backgroundColor: item.type === 'DOG' ? '#E1F5E9' : '#E7F3FF' }]}>
            <Text style={styles.tagText}>{item.type}</Text>
          </View>
          
          {item.gender && (
            <View style={[styles.tag, { backgroundColor: '#F5F0FF' }]}>
              <Text style={styles.tagText}>{item.gender}</Text>
            </View>
          )}
          
          {item.vaccinated && (
            <View style={[styles.tag, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.tagText}>Vaccinated</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
  
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search Pets</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, breed, etc."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {searchQuery !== '' && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                filterPets(pets, '', selectedType, selectedStatus);
              }}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filtersRow}
        contentContainerStyle={styles.filtersContent}
      >
        <FilterButton
          label="All Pets"
          isActive={!selectedType}
          onPress={() => handleTypeFilter(null)}
        />
        <FilterButton
          label="Dogs"
          isActive={selectedType === 'DOG'}
          onPress={() => handleTypeFilter('DOG')}
        />
        <FilterButton
          label="Cats"
          isActive={selectedType === 'CAT'}
          onPress={() => handleTypeFilter('CAT')}
        />
        
        <View style={styles.filterDivider} />
        
        <FilterButton
          label="Available"
          isActive={selectedStatus === 'AVAILABLE'}
          onPress={() => handleStatusFilter('AVAILABLE')}
        />
        <FilterButton
          label="Pending"
          isActive={selectedStatus === 'PENDING'}
          onPress={() => handleStatusFilter('PENDING')}
        />
        <FilterButton
          label="Adopted"
          isActive={selectedStatus === 'ADOPTED'}
          onPress={() => handleStatusFilter('ADOPTED')}
        />
      </ScrollView>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading pets...</Text>
        </View>
      ) : searching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : filteredPets.length === 0 ? (
        <View style={styles.emptyResultContainer}>
          <Ionicons name="search" size={60} color="#CCCCCC" />
          <Text style={styles.emptyResultText}>No pets found</Text>
          <Text style={styles.emptyResultSubtext}>
            Try different search terms or filters
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPets}
          renderItem={renderPetItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 46,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  filtersRow: {
    maxHeight: 50,
    marginBottom: 10,
  },
  filtersContent: {
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  filterButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  activeFilterButton: {
    backgroundColor: '#FF6B6B',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  filterDivider: {
    height: 24,
    width: 1,
    backgroundColor: '#DDD',
    marginHorizontal: 10,
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
  listContent: {
    padding: 15,
  },
  emptyResultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyResultText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 20,
  },
  emptyResultSubtext: {
    fontSize: 15,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  petCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  petImage: {
    width: 100,
    height: '100%',
  },
  petInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  petName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  petDetails: {
    marginBottom: 8,
  },
  petBreed: {
    fontSize: 14,
    color: '#666',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 3,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#555',
  },
});

export default SearchScreen;
