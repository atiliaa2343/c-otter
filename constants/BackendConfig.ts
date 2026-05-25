// Backend configuration for image URLs
// This should match your backend server URL

// For device testing, use your computer's local IP address (e.g., http://192.168.1.x:4000)
// Run `ipconfig getifaddr en0` (Mac) or `ipconfig` (Windows) to find your IP
// For simulator/emulator, localhost works fine
// For Expo Go on physical device, use your computer's local IP
export const BACKEND_URL = _getBackendUrl();

function _getBackendUrl(): string {
  // Use localhost for simulators/emulators, override with env var or local IP as needed
  if (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_CONTENT_API) {
    return process.env.EXPO_PUBLIC_CONTENT_API;
  }
  // Default to localhost for simulator/emulator
  return 'http://localhost:4000';
}

export const getImageUrl = (filename: string): string => {
  return `${BACKEND_URL}/images/${encodeURIComponent(filename)}`;
};
