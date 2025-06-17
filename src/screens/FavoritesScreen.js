import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import FavoritesService from '../services/FavoritesService';
import FavoritesDebugger from '../utils/FavoritesDebugger';

const FavoritesScreen = ({ navigation }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
    const loadFavorites = async () => {
    try {
      setLoading(true);
      
      // Debug: Log current favorites state
      await FavoritesDebugger.logFavorites();
      
      const favoritePets = await FavoritesService.getFavorites();
      console.log('Loaded favorites:', favoritePets.length, 'pets');
      setFavorites(favoritePets);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  // Load favorites when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );
  
  const handleRemoveFavorite = async (petId) => {
    try {
      const success = await FavoritesService.removeFavorite(petId);
      if (success) {
        // Remove from local state immediately for better UX
        setFavorites(prevFavorites => prevFavorites.filter(pet => pet.id !== petId));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };
    const renderPetItem = ({ item }) => {
    // Get the image URL for the pet
    const getImageUrl = () => {
      if (item.images && item.images.length > 0) {
        return `http://192.168.0.139:8080/api/pets/images/${item.images[0].id}`;
      }
      return null;
    };

    return (
      <TouchableOpacity
        style={styles.petCard}
        onPress={() => navigation.navigate('PetDetail', { pet: item })}
      >
        <Image
          source={getImageUrl() ? { uri: getImageUrl() } : require('../assets/pet1.jpg')}
          style={styles.petImage}
          resizeMode="cover"
        />
        
        {item.status === 'PENDING' && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Pending</Text>
          </View>
        )}
        
        <View style={styles.petInfo}>
          <View>
            <Text style={styles.petName}>{item.name}</Text>
            <Text style={styles.petBreed}>{item.breed}</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={14} color="#666" />
              <Text style={styles.locationText}>
                {item.location ? `${item.location.city}, ${item.location.state}` : 'Unknown location'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveFavorite(item.id)}
          >
            <Ionicons name="heart-dislike" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }
    return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Your Favorites</Text>
          <Text style={styles.subtitle}>Pets you've saved</Text>
        </View>
        {__DEV__ && (
          <TouchableOpacity
            style={styles.debugButton}
            onPress={() => FavoritesDebugger.logFavorites()}
          >
            <Ionicons name="bug" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {favorites.length > 0 ? (
        <FlatList
          data={favorites}
          renderItem={renderPetItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FF6B6B']}
              tintColor="#FF6B6B"
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={70} color="#CCCCCC" />
          <Text style={styles.emptyText}>No favorites yet</Text>
          <Text style={styles.emptySubtext}>
            When you find pets you like, tap the heart icon to save them here
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.browseButtonText}>Browse Pets</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
  },  header: {
    padding: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  debugButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  listContent: {
    padding: 15,
    paddingTop: 5,
  },
  petCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    overflow: 'hidden',
  },
  petImage: {
    width: '100%',
    height: 150,
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
  },
  petInfo: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  petBreed: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  removeButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  browseButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 25,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FavoritesScreen;
