import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dzgj7by1y',
  api_key: process.env.CLOUDINARY_API_KEY || '271357557433161',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'D0djP_1_jzcB-PTLsMDb_KwN9-Q',
  secure: true
});

export default cloudinary;