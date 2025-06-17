// Basic web implementation of BlobModule
const BlobModule = {
  createFromParts(parts, options) {
    return new Blob(parts, options);
  },
  release() {},
  addNetworkingHandler() {},
  enableBlobSupport() {},
  sendBlob() {},
  createBlob(data, type) {
    return new Blob([data], { type });
  }
};

export default BlobModule;
