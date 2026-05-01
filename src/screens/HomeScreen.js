import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import PetService from '../services/PetService';
import FavoritesService from '../services/FavoritesService';
import PetSwipeCard from '../components/PetSwipeCard';
import { Ionicons } from '@expo/vector-icons';

// Extracted outside component: prevents React from treating it as a new
// component type on every render, which would cause unnecessary unmounts.
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

const HomeScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);

  // ── Pagination state ──────────────────────────────────────────────────────
  const [petsQueue, setPetsQueue] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState(null);
  // Increment to remount PetSwipeCard and reset its internal index on filter change
  const [swipeKey, setSwipeKey] = useState(0);

  // Refs for mutable values accessed inside async callbacks (avoids stale closures)
  const currentPageRef = useRef(0);
  const isFetchingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const filtersRef = useRef(null);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    type: null,
    gender: null,
    vaccinated: null,
    neutered: null,
    specialNeeds: null,
  });

  // Keep filtersRef in sync with the latest filter state
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // ── Client-side filter helper ─────────────────────────────────────────────
  const applyClientFilters = useCallback((pets, activeFilters) => {
    if (!activeFilters) return pets;
    // Always keep only AVAILABLE pets (status filter is not on the paginated endpoint)
    let filtered = pets.filter(p => p.status === 'AVAILABLE');
    if (activeFilters.type) filtered = filtered.filter(p => p.type === activeFilters.type);
    if (activeFilters.gender) filtered = filtered.filter(p => p.gender === activeFilters.gender);
    if (activeFilters.vaccinated !== null) filtered = filtered.filter(p => p.vaccinated === activeFilters.vaccinated);
    if (activeFilters.neutered !== null) filtered = filtered.filter(p => p.neutered === activeFilters.neutered);
    if (activeFilters.specialNeeds !== null) filtered = filtered.filter(p => p.specialNeeds === activeFilters.specialNeeds);
    return filtered;
  }, []);

  // ── Initial / filter-reset fetch ──────────────────────────────────────────
  // Resets all pagination state, clears the queue and fetches page 0 fresh.
  const resetAndFetch = useCallback(async (activeFilters) => {
    isFetchingRef.current = false; // release any stale lock from previous session
    currentPageRef.current = 0;
    hasMoreRef.current = true;
    filtersRef.current = activeFilters;
    setPetsQueue([]);
    setInitialLoading(true);
    setError(null);
    setSwipeKey(prev => prev + 1); // remount PetSwipeCard → resets currentCardIndex

    try {
      const data = await PetService.getPetsPaginated(0, 10);
      const filtered = applyClientFilters(data.content ?? [], activeFilters);
      currentPageRef.current = 1;
      hasMoreRef.current = !data.last;
      setPetsQueue(filtered);
    } catch {
      setError('Failed to load pets. Please try again.');
    } finally {
      setInitialLoading(false);
    }
  }, [applyClientFilters]);

  // ── Background pre-fetch ──────────────────────────────────────────────────
  // Called by PetSwipeCard when ≤3 cards remain in the rendered queue.
  const fetchNextPage = useCallback(async () => {
    if (isFetchingRef.current || !hasMoreRef.current) return;
    isFetchingRef.current = true;
    setIsFetchingMore(true);

    try {
      const page = currentPageRef.current;
      const data = await PetService.getPetsPaginated(page, 10);
      const filtered = applyClientFilters(data.content ?? [], filtersRef.current ?? {});
      currentPageRef.current = page + 1;
      hasMoreRef.current = !data.last;

      setPetsQueue(prev => {
        const existingIds = new Set(prev.map(p => String(p.id)));
        const newPets = filtered.filter(p => !existingIds.has(String(p.id)));
        return [...prev, ...newPets];
      });
    } catch {
      // Background fetch failure is silent — existing queued cards remain swipeable
    } finally {
      isFetchingRef.current = false;
      setIsFetchingMore(false);
    }
  }, [applyClientFilters]);

  // Initial load on mount
  useEffect(() => {
    resetAndFetch(filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run only on mount

  const handleSwipeLeft = useCallback((_pet) => {
    // Future: track rejected pets to avoid re-showing them
  }, []);

  const handleSwipeRight = useCallback(async (pet) => {
    try {
      await FavoritesService.addFavorite(pet.id);
    } catch {
      // Swipe failures are silent; the user can still favourite from the detail screen
    }
  }, []);

  const handleCardPress = useCallback((pet) => {
    navigation.navigate('PetDetail', { pet });
  }, [navigation]);

  const applyFilters = useCallback(() => {
    setFilterModalVisible(false);
    resetAndFetch(filters);
  }, [resetAndFetch, filters]);

  const resetFilters = useCallback(() => {
    setFilters({
      type: null,
      gender: null,
      vaccinated: null,
      neutered: null,
      specialNeeds: null,
    });
    // Only resets local UI state; user clicks Apply to trigger a new fetch
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.greeting}>Hi, {userInfo?.fullName || userInfo?.username || 'there'}!</Text>
        <Text style={styles.headerTitle}>Find your perfect pet</Text>
      </View> */}
      
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
              const empty = { type: null, gender: null, vaccinated: null, neutered: null, specialNeeds: null };
              setFilters(empty);
              resetAndFetch(empty);
            }}
          >
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {initialLoading ? (
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
            onPress={() => resetAndFetch(filters)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <PetSwipeCard
          key={swipeKey}
          pets={petsQueue}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onCardPress={handleCardPress}
          onNeedMore={fetchNextPage}
          isFetchingMore={isFetchingMore}
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
