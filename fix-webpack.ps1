# Reset and update webpack-related packages
Write-Host "Updating webpack and related dependencies..." -ForegroundColor Yellow

# Remove current webpack-related packages
npm uninstall webpack webpack-cli webpack-dev-server @expo/webpack-config

# Install compatible versions
npm install --save-dev webpack@5.75.0 webpack-cli@4.10.0 webpack-dev-server@4.11.1
npm install --save @expo/webpack-config@^19.0.0

# Install required utilities for React Native Web
Write-Host "Installing React Native Web utilities..." -ForegroundColor Yellow
npm install --save-dev process process-nextick-args style-loader stream-browserify url-loader

# Install plugins and polyfills
Write-Host "Installing plugins and polyfills..." -ForegroundColor Yellow
npm install --save-dev @pmmmwh/react-refresh-webpack-plugin@0.5.10

# Clear the cache
Write-Host "Clearing cache..." -ForegroundColor Yellow
npx expo start --clear --non-interactive --no-dev --web

Write-Host "All dependencies installed! Try running 'npm run web:clean' now." -ForegroundColor Green
