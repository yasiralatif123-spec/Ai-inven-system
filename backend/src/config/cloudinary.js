const cloudinary = require("cloudinary").v2;

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return { cloudName, apiKey, apiSecret };
}

function ensureCloudinaryConfigured() {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  if (!cloudName || !apiKey || !apiSecret) {
    const err = new Error(
      "Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env."
    );
    err.statusCode = 500;
    throw err;
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  return cloudinary;
}

module.exports = { ensureCloudinaryConfigured, getCloudinaryConfig };