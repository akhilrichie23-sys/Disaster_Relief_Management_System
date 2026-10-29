const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'lon9ngij',
  api_key: process.env.CLOUDINARY_API_KEY || '888134351664641',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'C3yTQazxuvjjj1bJCW0-kYmUeDQ'
});

/**
 * Upload an image (base64 data URL or remote URL or file path) to Cloudinary
 * @param {string} fileData - Base64 string or image URI
 * @param {string} folder - Destination folder in Cloudinary
 * @returns {Promise<Object>} Upload result with secure_url
 */
async function uploadToCloudinary(fileData, folder = 'disaster_relief') {
  try {
    const result = await cloudinary.uploader.upload(fileData, {
      folder: folder,
      resource_type: 'auto'
    });
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message || 'Image upload failed'
    };
  }
}

module.exports = {
  cloudinary,
  uploadToCloudinary
};
