// PlatformColorValueTypes shim for web

// Simple color normalization function
const normalizeColor = (color) => {
  if (typeof color === 'string') {
    if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl')) {
      return color;
    }
    // Handle named colors
    return color;
  }
  return '#000000'; // Default black
};

export const normalizeColorObject = (color) => {
  if (color === null || color === undefined) {
    return null;
  }
  
  if (typeof color === 'object') {
    // If it's a color object with a default value, use that
    if (color.default) {
      return color;
    }
    // Otherwise, try to determine the color from the object
    return color;
  }
  
  return null;
};

export const processColorObject = (color) => {
  if (color === null || color === undefined) {
    return null;
  }
  
  if (typeof color === 'object') {
    // Handle platform color objects
    if (color.semantic || color.resource || color.dynamic) {
      // Use the default color or fallback to black
      return normalizeColor(color.default || '#000000');
    }
    
    // If it has an opaqueColor property, use that
    if (color.opaqueColor) {
      return normalizeColor(color.opaqueColor);
    }
  }
  
  // For non-object colors, normalize them directly
  return normalizeColor(color);
};
