# Cloudinary Integration for TypeScript LMS Backend

## 🚀 Implementation Summary

This document outlines the Cloudinary integration implemented to match the Java production setup.

## 📁 Files Created/Modified

### 1. **Cloudinary Configuration** (`src/config/cloudinaryConfig.ts`)
- Configures Cloudinary SDK with credentials from environment variables
- Matches Java CloudinaryConfig.java implementation
- Uses secure HTTPS URLs

### 2. **Cloudinary Service** (`src/services/CloudinaryService.ts`)
- **`uploadFile()`** - General file upload with auto resource type detection
- **`uploadImage()`** - Image upload using `resource_type: 'raw'` (matches Java)
- **`uploadVideo()`** - Video upload using `resource_type: 'video'` (matches Java)
- **`updateImage()`** - Update existing image with new content
- **`updateVideo()`** - Update existing video with new content
- **`deleteFile()`** - Delete files from Cloudinary
- **File validation** - Validates image/video file types before upload
- **URL parsing** - Extract public ID from Cloudinary URLs

### 3. **Cloudinary Upload Middleware** (`src/middleware/cloudinaryUploadMiddleware.ts`)
- **Memory storage** - Files stored in memory before uploading to Cloudinary
- **Automatic upload** - Files automatically uploaded to Cloudinary after multer processing
- **URL injection** - Cloudinary URLs added to request object as `req.cloudinaryUrl`
- **Multiple file support** - Handles single and multiple file uploads
- **Error handling** - Comprehensive error handling for failed uploads

### 4. **Updated Routes** (`src/routes/apiRoutes.ts`)
- **Course creation**: `POST /api/courses/` - Now uses Cloudinary for thumbnails
- **Course updates**: `PUT /api/courses/:id` - Now uses Cloudinary for thumbnails  
- **Speech-to-text**: Audio files uploaded to Cloudinary

### 5. **Updated Controllers** (`src/controllers/CourseController.ts`)
- **`createCourse()`** - Uses `req.cloudinaryUrl` instead of `req.file.path`
- **`updateCourse()`** - Uses `req.cloudinaryUrl` instead of `req.file.path`

### 6. **Environment Variables** (`.env`)
```env
CLOUDINARY_CLOUD_NAME=dzgj7by1y
CLOUDINARY_API_KEY=271357557433161
CLOUDINARY_API_SECRET=D0djP_1_jzcB-PTLsMDb_KwN9-Q
```

## 🔄 Architecture Changes

### **Before (Local Storage):**
```
File Upload → Local Disk → File Path → Database
```

### **After (Cloudinary):**
```
File Upload → Memory → Cloudinary → Cloudinary URL → Database
```

## 🌐 Cloudinary URL Patterns

The implementation generates URLs matching your production data:

### **Images** (Course Thumbnails, Avatars):
```
http://res.cloudinary.com/dzgj7by1y/raw/upload/v[timestamp]/[public_id]
```

### **Videos** (Course Content):
```
http://res.cloudinary.com/dzgj7by1y/video/upload/v[timestamp]/[public_id].mp4
```

## 🛡️ Security & Validation

- **File Type Validation**: Only allowed MIME types accepted
- **File Size Limits**: 100MB for videos, 5MB for images
- **Secure URLs**: All uploads use HTTPS
- **Error Handling**: Comprehensive error responses for failed uploads

## 📋 Usage Examples

### **Course Creation with Thumbnail:**
```bash
POST /api/courses/
Content-Type: multipart/form-data

{
  "title": "New Course",
  "categoryId": 1,
  "courseThumbnail": [uploaded_file]
}

# Response includes Cloudinary URL:
{
  "success": true,
  "data": {
    "courseThumbnail": "https://res.cloudinary.com/dzgj7by1y/raw/upload/v123456789/thumbnail.jpg"
  }
}
```

### **Video Upload:**
```javascript
const cloudinaryService = new CloudinaryService();
const videoUrl = await cloudinaryService.uploadVideo(fileBuffer, {
  originalName: 'lesson1.mp4'
});
```

## 🔧 Middleware Usage

### **Single File Upload:**
```typescript
// Uses Cloudinary
router.post('/upload', ...cloudinaryUploadMiddleware.single('file'), controller.method);

// Uses local storage (legacy)
router.post('/upload', uploadMiddleware.single('file'), controller.method);
```

### **Multiple Files:**
```typescript
router.post('/upload', ...cloudinaryUploadMiddleware.array('files', 5), controller.method);
```

## ✅ Benefits

1. **🌩️ Cloud Storage**: Files stored in Cloudinary cloud, not local disk
2. **🔗 Consistent URLs**: Matches existing production Cloudinary URLs
3. **🚀 Scalability**: No local disk space limitations
4. **🔄 Compatibility**: Maintains existing API structure
5. **🛡️ Reliability**: Cloudinary handles CDN, backup, and optimization
6. **🎨 Processing**: Automatic image/video optimization and transformations

## 🚦 Next Steps

1. **Test file uploads** through the API endpoints
2. **Verify Cloudinary URLs** are saved to database correctly
3. **Optional**: Implement file deletion when courses are deleted
4. **Optional**: Add image transformations (resize, compress, etc.)
5. **Optional**: Implement video processing webhooks

## 🔍 Troubleshooting

- **Upload failures**: Check Cloudinary credentials in `.env`
- **File size errors**: Verify file size limits in middleware
- **URL not in request**: Ensure middleware order is correct
- **Type errors**: Check file MIME type validation

The TypeScript backend now matches your Java production setup! 🎉