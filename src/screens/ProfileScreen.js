import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { userInfo, logout } = useContext(AuthContext);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  
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
  
  const handleBecomeTutor = () => {
    Alert.alert(
      "Become a Tutor",
      "Would you like to register as a pet tutor to post pets for adoption?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Continue", 
          onPress: () => {
            // Navigate to tutor registration screen
            // In a real app, this would be implemented
            Alert.alert("Coming Soon", "This feature is coming soon!");
          } 
        }
      ]
    );
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
            <Ionicons name="person" size={40} color="#999" />
          </View>
          <TouchableOpacity style={styles.editImageButton}>
            <Ionicons name="camera" size={18} color="white" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.name}>{userInfo?.fullName || "User"}</Text>
        <Text style={styles.email}>{userInfo?.email || userInfo?.username || ""}</Text>
        
        <TouchableOpacity style={styles.editProfileButton}>
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="person-circle-outline" size={22} color="#666" />
          <Text style={styles.menuText}>Personal Information</Text>
          <Ionicons name="chevron-forward" size={22} color="#CCC" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleBecomeTutor}>
          <Ionicons name="paw-outline" size={22} color="#666" />
          <Text style={styles.menuText}>Become a Tutor</Text>
          <Ionicons name="chevron-forward" size={22} color="#CCC" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="heart-outline" size={22} color="#666" />
          <Text style={styles.menuText}>Favorite Pets</Text>
          <Ionicons name="chevron-forward" size={22} color="#CCC" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="chatbubble-outline" size={22} color="#666" />
          <Text style={styles.menuText}>Messages</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <View style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={22} color="#666" />
          <Text style={styles.menuText}>Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: "#CCC", true: "#FFB6B6" }}
            thumbColor={notificationsEnabled ? "#FF6B6B" : "#F4F3F4"}
          />
        </View>
        
        <View style={styles.menuItem}>
          <Ionicons name="moon-outline" size={22} color="#666" />
          <Text style={styles.menuText}>Dark Mode</Text>
          <Switch
            value={darkModeEnabled}
            onValueChange={setDarkModeEnabled}
            trackColor={{ false: "#CCC", true: "#FFB6B6" }}
            thumbColor={darkModeEnabled ? "#FF6B6B" : "#F4F3F4"}
          />
        </View>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="language-outline" size={22} color="#666" />
          <Text style={styles.menuText}>Language</Text>
          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>English</Text>
            <Ionicons name="chevron-forward" size={22} color="#CCC" />
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={22} color="#666" />
          <Text style={styles.menuText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={22} color="#CCC" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="document-text-outline" size={22} color="#666" />
          <Text style={styles.menuText}>Terms & Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={22} color="#CCC" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="information-circle-outline" size={22} color="#666" />
          <Text style={styles.menuText}>About PetFinder</Text>
          <Ionicons name="chevron-forward" size={22} color="#CCC" />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={22} color="#FF6B6B" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      
      <Text style={styles.versionText}>Version 1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FF',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: 'white',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 15,
    color: '#666',
    marginTop: 5,
    marginBottom: 15,
  },
  editProfileButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderRadius: 20,
  },
  editProfileText: {
    color: '#FF6B6B',
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 15,
    paddingVertical: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  badge: {
    backgroundColor: '#FF6B6B',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 15,
    color: '#999',
    marginRight: 5,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginTop: 15,
    paddingVertical: 15,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF6B6B',
    marginLeft: 10,
  },
  versionText: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#999',
    fontSize: 14,
  },
});

export default ProfileScreen;
