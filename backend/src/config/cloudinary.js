// Cloudinary configuration placeholder
// Use environment variables for production configuration: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'mock_cloud_name',
  api_key: process.env.CLOUDINARY_API_KEY || 'mock_api_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'mock_api_secret',
};

console.log('Cloudinary Config initialized (mock values if not in env)');

export default cloudinaryConfig;
