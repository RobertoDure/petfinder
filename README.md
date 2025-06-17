# PetFinder App

A React Native mobile app for connecting pet adopters with pet tutors (shelters and individuals) with a Tinder-like swipe interface.

## Features

- User Registration and Authentication
- Tinder-like Swipe Card Interface for Pet Discovery
- Pet Search and Filtering
- Pet Detail View
- Favorites System
- Pet Location on Map
- Pet Image Gallery
- User Profile Management
- Pet Creation for Tutors

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/petfinder-app.git
cd petfinder-app
```

2. Install dependencies
```
npm install
# or
yarn install
```

3. Start the development server
```
npm start
# or
yarn start
```

4. Run on a device or emulator
   - Use the Expo Go app on your physical device
   - Press 'a' in the terminal to launch on Android emulator
   - Press 'i' in the terminal to launch on iOS simulator

## Project Structure

```
petfinder-app/
├── src/
│   ├── assets/          # Images, fonts, and other static assets
│   ├── components/      # Reusable UI components
│   ├── context/         # React context API for state management
│   ├── navigation/      # Navigation configuration
│   ├── screens/         # App screens
│   ├── services/        # API services
│   └── utils/           # Utility functions
├── App.js               # Root component
├── app.json             # Expo configuration
└── package.json         # Dependencies and scripts
```

## Backend API Integration

This app is designed to connect to a Spring Boot backend with the following endpoints:

- Authentication API: `/api/v1/auth`
- Pets API: `/api/pets`
- Pet Images API: `/api/pets/{petId}/images`
- Tutors API: `/api/tutors`

## Screenshots

(Add screenshots of your app here)

## Built With

- [React Native](https://reactnative.dev/) - Framework for building native apps
- [Expo](https://expo.dev/) - Platform for making universal native apps
- [React Navigation](https://reactnavigation.org/) - Navigation library
- [Axios](https://axios-http.com/) - HTTP client
- [React Native Deck Swiper](https://github.com/alexbrillant/react-native-deck-swiper) - Swipeable card component

## License

This project is licensed under the MIT License - see the LICENSE file for details.
