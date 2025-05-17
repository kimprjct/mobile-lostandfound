import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_UPLOAD_PRESET
} from '@env';

// Verify environment variables are loaded
console.log('Cloudinary Environment Variables Status:', {
  hasCloudName: !!CLOUDINARY_CLOUD_NAME,
  hasApiKey: !!CLOUDINARY_API_KEY,
  hasApiSecret: !!CLOUDINARY_API_SECRET,
  hasUploadPreset: !!CLOUDINARY_UPLOAD_PRESET
});

// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloudName: 'dcnojnny9',
  apiKey: '596476532838733',
  apiSecret: 'RSA6ykyB5H5Q100xdM-46pPciJY',
  uploadPreset: 'lost_and_found_preset'
};

// Log configuration (without sensitive data)
console.log('Cloudinary Config Loaded:', {
  cloudName: CLOUDINARY_CONFIG.cloudName,
  hasApiKey: !!CLOUDINARY_CONFIG.apiKey,
  hasApiSecret: !!CLOUDINARY_CONFIG.apiSecret,
  uploadPreset: CLOUDINARY_CONFIG.uploadPreset
});

export default CLOUDINARY_CONFIG; 