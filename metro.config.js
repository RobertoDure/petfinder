// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configure asset handling
config.resolver.assetExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', ...config.resolver.assetExts];

// Add resolution for web-specific modules
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native': path.resolve(__dirname, './node_modules/react-native'),
  'react-native-web': path.resolve(__dirname, './node_modules/react-native-web'),
};

// Handle asset files - removed deprecated metro-react-native-babel-transformer
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

// Handle image asset loading
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
