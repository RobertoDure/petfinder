import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthContext } from '../context/AuthContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main App Screens
import HomeScreen from '../screens/HomeScreen';
import PetDetailScreen from '../screens/PetDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SearchScreen from '../screens/SearchScreen';
import AddPetScreen from '../screens/AddPetScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Icon map: route name → [focusedIcon, unfocusedIcon]
const TAB_ICONS = {
  Home:      ['pets',           'pets'],
  Search:    ['search',         'search'],
  Favorites: ['favorite',       'favorite-border'],
  AddPet:    ['add-circle',     'add-circle-outline'],
  Profile:   ['person',         'person-outline'],
};

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        const [activeIcon, inactiveIcon] = TAB_ICONS[route.name] ?? ['help', 'help-outline'];
        return (
          <MaterialIcons
            name={focused ? activeIcon : inactiveIcon}
            size={size}
            color={color}
          />
        );
      },
      tabBarActiveTintColor: '#FF6B6B',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Favorites" component={FavoritesScreen} />
    <Tab.Screen name="AddPet" component={AddPetScreen} options={{ tabBarLabel: 'Add Pet' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="MainTabs"
      component={MainTabNavigator}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="PetDetail"
      component={PetDetailScreen}
      options={({ route }) => ({
        title: route.params?.pet?.name || 'Pet Details',
        headerBackTitleVisible: false,
      })}
    />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { userToken, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return userToken !== null ? <MainStack /> : <AuthStack />;
};

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default AppNavigator;
