// Backend configuration for image URLs
// This should match your backend server URL

// For device testing, use your computer's local IP address (e.g., http://192.168.1.x:4000)
// Run `ipconfig getifaddr en0` (Mac) or `ipconfig` (Windows) to find your IP
// For simulator/emulator, localhost works fine
export const BACKEND_URL = 'http://192.168.1.171:4000';

export const getImageUrl = (filename: string): string => {
  return `${BACKEND_URL}/images/${encodeURIComponent(filename)}`;
};
