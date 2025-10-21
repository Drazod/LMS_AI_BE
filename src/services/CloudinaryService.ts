import cloudinary from '../config/cloudinaryConfig';

export class CloudinaryService {
  
  /**
   * Upload any file to Cloudinary
   */
  async uploadFile(fileBuffer: Buffer, options?: any): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            ...options
          },
          (error: any, result: any) => {
            if (error) {
              reject(new Error(`Cloudinary upload failed: ${error.message}`));
            } else if (result) {
              resolve(result.secure_url);
            } else {
              reject(new Error('Upload failed: No result returned'));
            }
          }
        ).end(fileBuffer);
      });
    } catch (error) {
      throw new Error(`File upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload image to Cloudinary (using 'raw' resource type like Java version)
   */
  async uploadImage(fileBuffer: Buffer, options?: any): Promise<string> {
    try {
      this.validateImageType(options?.originalName || 'file');
      
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw', // Matching Java implementation
            ...options
          },
          (error: any, result: any) => {
            if (error) {
              reject(new Error(`Image upload failed: ${error.message}`));
            } else if (result) {
              resolve(result.secure_url);
            } else {
              reject(new Error('Image upload failed: No result returned'));
            }
          }
        ).end(fileBuffer);
      });
    } catch (error) {
      throw new Error(`Image upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload video to Cloudinary
   */
  async uploadVideo(fileBuffer: Buffer, options?: any): Promise<string> {
    try {
      this.validateVideoType(options?.originalName || 'file');
      
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'video', // Matching Java implementation
            ...options
          },
          (error: any, result: any) => {
            if (error) {
              reject(new Error(`Video upload failed: ${error.message}`));
            } else if (result) {
              resolve(result.secure_url);
            } else {
              reject(new Error('Video upload failed: No result returned'));
            }
          }
        ).end(fileBuffer);
      });
    } catch (error) {
      throw new Error(`Video upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update existing image
   */
  async updateImage(publicId: string, fileBuffer: Buffer, options?: any): Promise<string> {
    try {
      this.validateImageType(options?.originalName || 'file');
      
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw',
            public_id: publicId,
            overwrite: true,
            ...options
          },
          (error: any, result: any) => {
            if (error) {
              reject(new Error(`Image update failed: ${error.message}`));
            } else if (result) {
              resolve(result.secure_url);
            } else {
              reject(new Error('Image update failed: No result returned'));
            }
          }
        ).end(fileBuffer);
      });
    } catch (error) {
      throw new Error(`Image update error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update existing video
   */
  async updateVideo(publicId: string, fileBuffer: Buffer, options?: any): Promise<string> {
    try {
      this.validateVideoType(options?.originalName || 'file');
      
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'video',
            public_id: publicId,
            overwrite: true,
            ...options
          },
          (error: any, result: any) => {
            if (error) {
              reject(new Error(`Video update failed: ${error.message}`));
            } else if (result) {
              resolve(result.secure_url);
            } else {
              reject(new Error('Video update failed: No result returned'));
            }
          }
        ).end(fileBuffer);
      });
    } catch (error) {
      throw new Error(`Video update error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<string> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });
      return result.result;
    } catch (error) {
      throw new Error(`File deletion error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate image file types
   */
  private validateImageType(filename: string): void {
    const allowedImageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const fileExtension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    if (!allowedImageTypes.includes(fileExtension)) {
      throw new Error(`Invalid image type: ${fileExtension}. Allowed types: ${allowedImageTypes.join(', ')}`);
    }
  }

  /**
   * Validate video file types
   */
  private validateVideoType(filename: string): void {
    const allowedVideoTypes = ['.mp4', '.avi', '.mov', '.wmv', '.mkv', '.webm', '.flv', '.m4v'];
    const fileExtension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    if (!allowedVideoTypes.includes(fileExtension)) {
      throw new Error(`Invalid video type: ${fileExtension}. Allowed types: ${allowedVideoTypes.join(', ')}`);
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  extractPublicId(cloudinaryUrl: string): string {
    try {
      // Example URL: https://res.cloudinary.com/dzgj7by1y/video/upload/v1758558347/vkxpsw4ejusqojtibv9w.mp4
      const urlParts = cloudinaryUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      return filename.substring(0, filename.lastIndexOf('.'));
    } catch (error) {
      throw new Error('Invalid Cloudinary URL format');
    }
  }
}

export default CloudinaryService;