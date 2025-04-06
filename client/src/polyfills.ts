/**
 * WebRTC Polyfills
 * These polyfills are needed for simple-peer and other WebRTC libraries to work in the browser
 */

// Define global for browser environments
if (typeof global === 'undefined') {
  (window as any).global = window;
}

// Define process for Node.js compatibility
if (typeof process === 'undefined') {
  (window as any).process = { env: {} };
}

// Define Buffer for Node.js compatibility
if (typeof Buffer === 'undefined') {
  (window as any).Buffer = { 
    isBuffer: function(obj: any) { return false; }
  };
}

export default {}; // Export empty default to make TypeScript happy