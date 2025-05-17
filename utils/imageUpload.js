import CLOUDINARY_CONFIG from './cloudinaryConfig';
import * as Crypto from 'expo-crypto';

export const uploadImageToCloudinary = async (imageUri) => {
  try {
    console.log('Starting image upload to Cloudinary...');
    console.log('Config being used:', {
      cloudName: CLOUDINARY_CONFIG.cloudName,
      uploadPreset: CLOUDINARY_CONFIG.uploadPreset
    });

    // Create form data
    const formData = new FormData();
    
    // Append the file
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'upload.jpg'
    });
    
    // Add upload preset
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    
    // Add timestamp and other parameters
    const timestamp = Math.round((new Date()).getTime() / 1000);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', CLOUDINARY_CONFIG.apiKey);

    // Log the upload URL
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
    console.log('Uploading to:', uploadUrl);

    // Upload to Cloudinary
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      }
    });

    // Log the response status
    console.log('Upload response status:', response.status);

    // Get the response data
    const data = await response.json();
    console.log('Upload response data:', data);
    
    if (data.secure_url) {
      console.log('Upload successful:', data.secure_url);
      return {
        success: true,
        url: data.secure_url,
        publicId: data.public_id
      };
    } else {
      console.error('Upload failed - No secure_url in response:', data);
      throw new Error(data.error?.message || 'Upload failed');
    }
  } catch (error) {
    console.error('Detailed upload error:', {
      message: error.message,
      stack: error.stack,
      error
    });
    return {
      success: false,
      error: error.message || 'Upload failed'
    };
  }
};

export const deleteImageFromCloudinary = async (publicId) => {
  try {
    const timestamp = Math.round((new Date).getTime() / 1000);
    const signature = await generateSignature(publicId, timestamp);

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('signature', signature);
    formData.append('api_key', CLOUDINARY_CONFIG.apiKey);
    formData.append('timestamp', timestamp);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/destroy`,
      {
        method: 'POST',
        body: formData
      }
    );

    const data = await response.json();
    return {
      success: data.result === 'ok',
      error: data.result !== 'ok' ? data.result : null
    };
  } catch (error) {
    console.error('Error deleting image:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Helper function to generate signature for delete operations
const generateSignature = async (publicId, timestamp) => {
  const str = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_CONFIG.apiSecret}`;
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA1,
    str
  );
  return digest;
}; 