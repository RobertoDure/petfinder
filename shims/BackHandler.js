// BackHandler shim for web
export default {
  addEventListener: () => ({ remove: () => {} }),
  removeEventListener: () => {},
  exitApp: () => {},
};
