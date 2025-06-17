const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  // Modify env to avoid dev server validation issues
  env = {
    ...env,
    mode: env.mode || 'development'
  };

  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: ['@codler/react-native-keyboard-aware-scroll-view']
    },
    // Ensure devServer configuration is valid for newer webpack
    devServer: {
      ...env.devServer,
      historyApiFallback: true,
      hot: true
    }
  }, argv);
  // Customize the config to fix the React Native Web issues
    // Add fallback for missing modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    'crypto': false,
    'stream': false,
    'buffer': require.resolve('buffer/'),
    'fs': false,
    'path': false
  };
  
  // Add rules for handling various file types
  config.module.rules.push(
    {
      test: /\\.(gif|jpe?g|png|svg)$/,
      type: 'asset/resource', // Replaced file-loader with webpack 5 asset modules
      generator: {
        filename: '[name].[ext]' // Ensures output filename remains the same
      }
    },
    {
      test: /\\.(woff|woff2|eot|ttf|otf)$/,
      use: {
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
        }
      }
    }
  );
    // Add plugins for Buffer support
  const webpack = require('webpack');
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  );
  
  // Fix for webpack-dev-server compatibility issues
  if (config.devServer) {
    // Remove problematic property causing validation error
    if (config.devServer._assetEmittingPreviousFiles) {
      delete config.devServer._assetEmittingPreviousFiles;
    }
    
    // Make sure devServer options match the expected schema
    config.devServer = {
      static: config.devServer.static || config.devServer.contentBase,
      hot: true,
      compress: true,
      historyApiFallback: true,
      host: config.devServer.host || 'localhost',
      port: config.devServer.port || 19006,
      client: {
        overlay: true,
        progress: true
      },
      ...config.devServer,
    };
  }

  config.resolve.alias = {
    ...config.resolve.alias,
    // Common aliases
    'react-native$': 'react-native-web',
    
    // Handle Platform import issues
    '../Utilities/Platform': 'react-native-web/dist/exports/Platform',
    '../../Utilities/Platform': 'react-native-web/dist/exports/Platform',
    './Platform': 'react-native-web/dist/exports/Platform',
    
    // Handle Image module issues
    '../../Image/Image': 'react-native-web/dist/exports/Image',
    '../Image/Image': 'react-native-web/dist/exports/Image',
    './Image': 'react-native-web/dist/exports/Image',
      // Create empty shims for native modules with no web implementation
    './RCTAlertManager': path.resolve(__dirname, './shims/empty.js'),
    './RCTNetworking': path.resolve(__dirname, './shims/RCTNetworking.js'),
    './NativeDialogManagerAndroid': path.resolve(__dirname, './shims/empty.js'),
    '../DevToolsSettings/DevToolsSettingsManager': path.resolve(__dirname, './shims/empty.js'),
    './BaseViewConfig': path.resolve(__dirname, './shims/empty.js'),
    './PlatformColorValueTypes': path.resolve(__dirname, './shims/PlatformColorValueTypes.js'),
    '../../StyleSheet/PlatformColorValueTypes': path.resolve(__dirname, './shims/PlatformColorValueTypes.js'),
    '../StyleSheet/PlatformColorValueTypes': path.resolve(__dirname, './shims/PlatformColorValueTypes.js'),
    '../Components/AccessibilityInfo/legacySendAccessibilityEvent': path.resolve(__dirname, './shims/empty.js'),
    '../Utilities/BackHandler': path.resolve(__dirname, './shims/BackHandler.js'),
    '../Blob/BlobManager': path.resolve(__dirname, './shims/empty.js'),
    'react-native/Libraries/Blob/BlobManager': path.resolve(__dirname, './shims/empty.js'),
    './BlobModule': path.resolve(__dirname, './shims/BlobModule.js'),
    '../NativeModules/specs/NativeBlobModule': path.resolve(__dirname, './shims/BlobModule.js'),
    'react-native/Libraries/Blob/BlobModule': path.resolve(__dirname, './shims/BlobModule.js'),
    // Additional aliases for React Native Web components
    '../../StyleSheet/StyleSheet': 'react-native-web/dist/exports/StyleSheet',
    '../StyleSheet/StyleSheet': 'react-native-web/dist/exports/StyleSheet',
    './StyleSheet': 'react-native-web/dist/exports/StyleSheet',
    '../../Components/View/View': 'react-native-web/dist/exports/View',
    '../Components/View/View': 'react-native-web/dist/exports/View',
    './View': 'react-native-web/dist/exports/View',
    '../../Text/Text': 'react-native-web/dist/exports/Text',
    '../Text/Text': 'react-native-web/dist/exports/Text',
    './Text': 'react-native-web/dist/exports/Text',
    '../../Utilities/DeviceInfo': path.resolve(__dirname, './shims/DeviceInfo.js'),
    '../Utilities/DeviceInfo': path.resolve(__dirname, './shims/DeviceInfo.js'),
    './DeviceInfo': path.resolve(__dirname, './shims/DeviceInfo.js'),
    '../../Components/StatusBar/StatusBar': 'react-native-web/dist/exports/StatusBar',
    '../Components/StatusBar/StatusBar': 'react-native-web/dist/exports/StatusBar',
    './StatusBar': 'react-native-web/dist/exports/StatusBar'
  };

  return config;
};
