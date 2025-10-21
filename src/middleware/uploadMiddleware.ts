import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create subdirectories for different file types
const subDirs = ['images', 'videos', 'audio', 'documents'];
subDirs.forEach(dir => {
  const dirPath = path.join(uploadDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    let uploadPath = uploadDir;
    
    // Determine upload path based on file type
    if (file.mimetype.startsWith('image/')) {
      uploadPath = path.join(uploadDir, 'images');
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath = path.join(uploadDir, 'videos');
    } else if (file.mimetype.startsWith('audio/')) {
      uploadPath = path.join(uploadDir, 'audio');
    } else {
      uploadPath = path.join(uploadDir, 'documents');
    }
    
    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = `${file.fieldname}-${uniqueSuffix}${fileExtension}`;
    cb(null, fileName);
  }
});

// File filter function
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

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 10 // Maximum 10 files
  }
});

// Specific upload middlewares for different use cases
export const uploadMiddleware = {
  // Single file upload
  single: (fieldName: string) => upload.single(fieldName),
  
  // Multiple files upload
  array: (fieldName: string, maxCount: number = 10) => upload.array(fieldName, maxCount),
  
  // Multiple fields upload
  fields: (fields: { name: string; maxCount?: number }[]) => upload.fields(fields),
  
  // Any files upload
  any: () => upload.any(),
  
  // No files upload (for form data only)
  none: () => upload.none()
};

// Specific upload configurations for different file types
export const imageUpload = multer({
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
});

export const videoUpload = multer({
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
});

export const audioUpload = multer({
  storage: storage,
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for audio
    files: 1
  }
});

export const documentUpload = multer({
  storage: storage,
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = [
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
      cb(new Error('Only document files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for documents
    files: 1
  }
});

// Helper function to clean up uploaded files
export const cleanupFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up file: ${filePath}`);
    }
  } catch (error) {
    console.error(`Failed to cleanup file ${filePath}:`, error);
  }
};

// Helper function to get file info
export const getFileInfo = (file: Express.Multer.File) => {
  return {
    originalName: file.originalname,
    fileName: file.filename,
    filePath: file.path,
    size: file.size,
    mimeType: file.mimetype,
    uploadedAt: new Date()
  };
};