// Basic web implementation of DeviceInfo
const DeviceInfo = {
  getConstants() {
    // Check if the device might be an iPhone X or newer (devices with notch)
    const isIPhoneWithNotch = () => {
      // Only run iPhone X detection if we're on iOS
      if (typeof window !== 'undefined' && /iPhone/.test(navigator.userAgent)) {
        // iPhone X/XS/11/12/13/14
        const ratios = [2.165, 2.164, 2.1602];  // Common aspect ratios for notched iPhones
        const ratio = window.screen.height / window.screen.width;
        // Check if the device's aspect ratio matches any known notched iPhone ratios
        return ratios.some(r => Math.abs(ratio - r) < 0.1);
      }
      return false;
    };

    return {
      isIPhoneX_deprecated: isIPhoneWithNotch(),
      Version: 1,
      Dimensions: {
        window: {
          width: window.innerWidth,
          height: window.innerHeight,
          scale: window.devicePixelRatio || 1,
          fontScale: 1
        },
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          scale: window.devicePixelRatio || 1,
          fontScale: 1
        }
      }
    };
  }
};

export default DeviceInfo;
