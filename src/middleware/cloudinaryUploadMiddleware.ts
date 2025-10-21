import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import CloudinaryService from '../services/CloudinaryService';

const cloudinaryService = new CloudinaryService();

// Use memory storage to hold file in memory before uploading to Cloudinary
const storage = multer.memoryStorage();

// File filter function (same validation as before)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Define allowed file types
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    // Videos
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/mkv',
    'video/webm',
    'video/flv',
    // Audio
    'audio/mp3',
    'audio/mpeg',
    'audio/wav',
    'audio/m4a',
    'audio/aac',
    'audio/ogg',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`));
  }
};

// Multer configuration for memory storage
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 10 // Maximum 10 files
  }
});

// Cloudinary upload middleware
const uploadToCloudinary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file && !req.files) {
      return next(); // No files to upload
    }

    // Handle single file upload
    if (req.file) {
      const file = req.file;
      let cloudinaryUrl: string;

      // Determine upload type based on mimetype
      if (file.mimetype.startsWith('image/')) {
        cloudinaryUrl = await cloudinaryService.uploadImage(file.buffer, {
          originalName: file.originalname
        });
      } else if (file.mimetype.startsWith('video/')) {
        cloudinaryUrl = await cloudinaryService.uploadVideo(file.buffer, {
          originalName: file.originalname
        });
      } else {
        cloudinaryUrl = await cloudinaryService.uploadFile(file.buffer, {
          originalName: file.originalname
        });
      }

      // Add Cloudinary URL to request object
      (req as any).cloudinaryUrl = cloudinaryUrl;
    }

    // Handle multiple files upload
    if (req.files && Array.isArray(req.files)) {
      const files = req.files as Express.Multer.File[];
      const cloudinaryUrls: string[] = [];

      for (const file of files) {
        let cloudinaryUrl: string;

        if (file.mimetype.startsWith('image/')) {
          cloudinaryUrl = await cloudinaryService.uploadImage(file.buffer, {
            originalName: file.originalname
          });
        } else if (file.mimetype.startsWith('video/')) {
          cloudinaryUrl = await cloudinaryService.uploadVideo(file.buffer, {
            originalName: file.originalname
          });
        } else {
          cloudinaryUrl = await cloudinaryService.uploadFile(file.buffer, {
            originalName: file.originalname
          });
        }

        cloudinaryUrls.push(cloudinaryUrl);
      }

      // Add Cloudinary URLs to request object
      (req as any).cloudinaryUrls = cloudinaryUrls;
    }

    next();
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Export middleware functions
export const cloudinaryUploadMiddleware = {
  // Single file upload with Cloudinary
  single: (fieldName: string) => [
    upload.single(fieldName),
    uploadToCloudinary
  ],
  
  // Multiple files upload with Cloudinary
  array: (fieldName: string, maxCount: number = 10) => [
    upload.array(fieldName, maxCount),
    uploadToCloudinary
  ],
  
  // Multiple fields upload with Cloudinary
  fields: (fields: { name: string; maxCount?: number }[]) => [
    upload.fields(fields),
    uploadToCloudinary
  ],
  
  // Any files upload with Cloudinary
  any: () => [
    upload.any(),
    uploadToCloudinary
  ],
  
  // No files upload (for form data only)
  none: () => upload.none()
};

// Specific upload configurations for different file types
export const imageUploadCloudinary = [
  multer({
    storage: storage,
    fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB for images
      files: 1
    }
  }).single('image'),
  uploadToCloudinary
];

export const videoUploadCloudinary = [
  multer({
    storage: storage,
    fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed'));
      }
    },
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB for videos
      files: 1
    }
  }).single('video'),
  uploadToCloudinary
];

// Keep original middleware for backward compatibility
export const uploadMiddleware = {
  single: (fieldName: string) => upload.single(fieldName),
  array: (fieldName: string, maxCount: number = 10) => upload.array(fieldName, maxCount),
  fields: (fields: { name: string; maxCount?: number }[]) => upload.fields(fields),
  any: () => upload.any(),
  none: () => upload.none()
};