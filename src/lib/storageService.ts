import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { ImageService } from './imageService';

export class StorageService {
  // Upload image to Firebase Storage with processing
  static async uploadImage(file: File, path: string, type: 'thumbnail' | 'cover'): Promise<string> {
    try {
      // Process image (validate and resize)
      const { file: processedFile } = await ImageService.processImageForUpload(file, type);
      
      const fullPath = `blog-images/${path}`;
      const storageRef = ref(storage, fullPath);
      const snapshot = await uploadBytes(storageRef, processedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      throw error;
    }
  }

  // Upload image without processing (for existing images)
  static async uploadImageRaw(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, `blog-images/${path}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      throw error;
    }
  }

  // Delete image from Firebase Storage
  static async deleteImage(url: string): Promise<void> {
    try {
      const imageRef = ref(storage, url);
      await deleteObject(imageRef);
    } catch (error) {
      throw error;
    }
  }

  // Generate unique filename
  static generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${timestamp}_${randomString}.${extension}`;
  }
}
