// Image processing utilities for blog thumbnails and covers

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  dimensions?: ImageDimensions;
}

export class ImageService {
  // Standard dimensions for different image types
  static readonly THUMBNAIL_DIMENSIONS = { width: 300, height: 200 };
  static readonly COVER_DIMENSIONS = { width: 1200, height: 600 };
  
  // Maximum file sizes (in bytes)
  static readonly MAX_THUMBNAIL_SIZE = 500 * 1024; // 500KB
  static readonly MAX_COVER_SIZE = 2 * 1024 * 1024; // 2MB

  // Allowed image types
  static readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  // Validate image file
  static validateImage(file: File, type: 'thumbnail' | 'cover'): ImageValidationResult {
    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: `Invalid file type. Allowed types: ${this.ALLOWED_TYPES.join(', ')}`
      };
    }

    // Check file size
    const maxSize = type === 'thumbnail' ? this.MAX_THUMBNAIL_SIZE : this.MAX_COVER_SIZE;
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return {
        isValid: false,
        error: `File too large. Maximum size for ${type}: ${maxSizeMB}MB`
      };
    }

    return { isValid: true };
  }

  // Resize image to target dimensions
  static async resizeImage(file: File, targetDimensions: ImageDimensions): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        const { width: newWidth, height: newHeight } = this.calculateAspectRatio(
          img.width,
          img.height,
          targetDimensions.width,
          targetDimensions.height
        );

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and resize image
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Failed to resize image'));
            }
          },
          file.type,
          0.9 // Quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Calculate aspect ratio preserving dimensions
  private static calculateAspectRatio(
    originalWidth: number,
    originalHeight: number,
    targetWidth: number,
    targetHeight: number
  ): ImageDimensions {
    const aspectRatio = originalWidth / originalHeight;
    const targetAspectRatio = targetWidth / targetHeight;

    let newWidth = targetWidth;
    let newHeight = targetHeight;

    if (aspectRatio > targetAspectRatio) {
      // Image is wider than target aspect ratio
      newHeight = targetWidth / aspectRatio;
    } else {
      // Image is taller than target aspect ratio
      newWidth = targetHeight * aspectRatio;
    }

    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight)
    };
  }

  // Get image dimensions
  static async getImageDimensions(file: File): Promise<ImageDimensions> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Process image for upload (validate and resize)
  static async processImageForUpload(
    file: File,
    type: 'thumbnail' | 'cover'
  ): Promise<{ file: File; dimensions: ImageDimensions }> {
    // Validate image
    const validation = this.validateImage(file, type);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Get target dimensions
    const targetDimensions = type === 'thumbnail' 
      ? this.THUMBNAIL_DIMENSIONS 
      : this.COVER_DIMENSIONS;

    // Resize image
    const resizedFile = await this.resizeImage(file, targetDimensions);
    
    // Get final dimensions
    const dimensions = await this.getImageDimensions(resizedFile);

    return { file: resizedFile, dimensions };
  }
}
