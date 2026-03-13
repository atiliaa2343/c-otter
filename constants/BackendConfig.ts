// Backend configuration for image URLs
// This should match your backend server URL

// Default to localhost for development - update this to your server URL in production
// For device testing, use your computer's local IP address (e.g., http://192.168.1.x:4000)
export const BACKEND_URL = 'http://10.0.0.92:4000';

export const getImageUrl = (filename: string): string => {
  return `${BACKEND_URL}/images/${encodeURIComponent(filename)}`;
};
