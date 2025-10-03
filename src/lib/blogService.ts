import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface BlogPost {
  id?: string;
  slug?: string; // For slug-based search and retrieval
  
  // P1: tags, labels, access_type, status, metadata (map type)
  tags?: string[];
  labels?: string[];
  access_type: 'premium' | 'free';
  status?: 'draft' | 'approved' | 'archived';
  metadata?: Record<string, any>;
  
  // P2: thumbnail_url, cover_url, author, title, excerpt, generator
  thumbnail_url?: string;
  cover_url?: string;
  author?: string;
  title?: string;
  excerpt?: string;
  generator?: string;
  
  // P3: content_hash, content_html (HTML as string)
  content_hash?: string;
  content_html?: string;
  
  // Additional fields from database
  link?: string;
  language?: string;
  web_master?: string;
  updated_at?: string;
  
  // Legacy fields
  created_at?: string;
  published_at?: string;
  isActive?: boolean;
}

export class BlogService {
  private static collectionName = 'blogs';

  // Get all blog posts
  static async getAllBlogs(): Promise<BlogPost[]> {
    try {
      const blogsRef = collection(db, this.collectionName);
      const querySnapshot = await getDocs(blogsRef);
      
      const blogs = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const blog = {
          id: doc.id,
          ...data
        } as BlogPost;
        return blog;
      });
      
      return blogs;
    } catch (error) {
      throw error;
    }
  }

  // Get active blog posts only
  static async getActiveBlogs(): Promise<BlogPost[]> {
    try {
      const blogsRef = collection(db, this.collectionName);
      const q = query(blogsRef, where('isActive', '==', true), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BlogPost));
    } catch (error) {
      throw error;
    }
  }

  // Get blog by ID
  static async getBlogById(id: string): Promise<BlogPost | null> {
    try {
      const blogRef = doc(db, this.collectionName, id);
      const blogSnap = await getDocs(collection(db, this.collectionName));
      
      const blog = blogSnap.docs.find(doc => doc.id === id);
      if (blog) {
        return {
          id: blog.id,
          ...blog.data()
        } as BlogPost;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Update blog post
  static async updateBlog(id: string, blogData: Partial<BlogPost>): Promise<void> {
    try {
      const blogRef = doc(db, this.collectionName, id);
      await updateDoc(blogRef, {
        ...blogData,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      throw error;
    }
  }

  // Update blog post with delta (only changed fields)
  static async updateBlogDelta(id: string, originalData: BlogPost, newData: Partial<BlogPost>): Promise<void> {
    try {
      // For now, let's update all fields to ensure they get saved properly
      const updateData = {
        ...newData,
        updated_at: new Date().toISOString()
      };
      
      const blogRef = doc(db, this.collectionName, id);
      await updateDoc(blogRef, updateData);
      
    } catch (error) {
      throw error;
    }
  }

  // Delete blog post
  static async deleteBlog(id: string): Promise<void> {
    try {
      const blogRef = doc(db, this.collectionName, id);
      await deleteDoc(blogRef);
    } catch (error) {
      throw error;
    }
  }

  // Toggle blog active status
  static async toggleBlogStatus(id: string, isActive: boolean): Promise<void> {
    try {
      const blogRef = doc(db, this.collectionName, id);
      await updateDoc(blogRef, {
        isActive,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      throw error;
    }
  }

  // Get blogs by access type
  static async getBlogsByAccessType(accessType: 'premium' | 'free'): Promise<BlogPost[]> {
    try {
      const blogsRef = collection(db, this.collectionName);
      const q = query(blogsRef, where('access_type', '==', accessType), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BlogPost));
    } catch (error) {
      throw error;
    }
  }

  // Get blog by slug
  static async getBlogBySlug(slug: string): Promise<BlogPost | null> {
    try {
      const blogsRef = collection(db, this.collectionName);
      const q = query(blogsRef, where('slug', '==', slug));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        } as BlogPost;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // Generate slug from title
  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  }
}
