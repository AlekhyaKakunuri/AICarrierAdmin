import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BlogPost, BlogService } from '@/lib/blogService';
import { StorageService } from '@/lib/storageService';
import AdvancedContentEditor from './AdvancedContentEditor';
import {X, Plus, Trash2 } from 'lucide-react';

interface BlogUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  blog: BlogPost | null;
  onUpdate: () => void;
  isCreateMode?: boolean;
}

const BlogUpdateModal = ({ isOpen, onClose, blog, onUpdate, isCreateMode = false }: BlogUpdateModalProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Form state organized by priority
  const [formData, setFormData] = useState({
    // P1: tags, labels, access_type, status, metadata
    tags: [] as string[],
    labels: [] as string[],
    access_type: 'free' as 'premium' | 'free',
    status: 'draft' as 'draft' | 'approved' | 'archived',
    metadata: {} as Record<string, any>,
    
    // P2: thumbnail_url, cover_url, author, title, excerpt, generator
    thumbnail_url: '',
    cover_url: '',
    author: '',
    title: '',
    excerpt: '',
    generator: '',
    
    // P3: content_hash, content_html
    content_hash: '',
    content_html: '',
    
    // Additional fields that might be missing
    slug: '',
    link: '',
    language: 'en',
    web_master: '',
    published_at: '',
    created_at: '',
  });


  // Tag and label input states
  const [newTag, setNewTag] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newMetadataKey, setNewMetadataKey] = useState('');
  const [newMetadataValue, setNewMetadataValue] = useState('');

  // File upload states
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    if (blog && isOpen) {
      const initialData = {
        tags: (blog.tags || []) as string[],
        labels: (blog.labels || []) as string[],
        access_type: (blog.access_type || 'free') as 'free' | 'premium',
        status: (blog.status || 'draft') as 'draft' | 'approved' | 'archived',
        metadata: (blog.metadata || {}) as Record<string, any>,
        thumbnail_url: blog.thumbnail_url || '',
        cover_url: blog.cover_url || '',
        author: blog.author || '',
        title: blog.title || '',
        excerpt: blog.excerpt || '',
        generator: blog.generator || '',
        content_hash: blog.content_hash || '',
        content_html: blog.content_html || '',
        slug: blog.slug || '',
        link: blog.link || '',
        language: blog.language || 'en',
        web_master: blog.web_master || '',
        published_at: blog.published_at || '',
        created_at: blog.created_at || '',
      };
      
      setFormData(initialData);
    } else if (isCreateMode && isOpen) {
      // Reset form for create mode
      const emptyData = {
        tags: [] as string[],
        labels: [] as string[],
        access_type: 'free' as 'free' | 'premium',
        status: 'draft' as 'draft' | 'approved' | 'archived',
        metadata: {} as Record<string, any>,
        thumbnail_url: '',
        cover_url: '',
        author: '',
        title: '',
        excerpt: '',
        generator: '',
        content_hash: '',
        content_html: '',
        slug: '',
        link: '',
        language: 'en',
        web_master: '',
        published_at: '',
        created_at: '',
      };
      setFormData(emptyData);
    }
  }, [blog, isCreateMode, isOpen]);


  const handleUpdate = async () => {
    if (isCreateMode) {
      return;
    }

    if (!blog?.id) return;

    try {
      setLoading(true);
      
      // Handle file uploads first
      let thumbnailUrl = formData.thumbnail_url;
      let coverUrl = formData.cover_url;

      if (thumbnailFile) {
        const fileName = StorageService.generateFileName(thumbnailFile.name);
        thumbnailUrl = await StorageService.uploadImage(thumbnailFile, `thumbnails/${fileName}`, 'thumbnail');
      }

      if (coverFile) {
        const fileName = StorageService.generateFileName(coverFile.name);
        coverUrl = await StorageService.uploadImage(coverFile, `covers/${fileName}`, 'cover');
      }

      // Generate slug from title if not provided
      const slug = formData.title ? BlogService.generateSlug(formData.title) : blog.slug;

      // Prepare update data - only update fields that have been changed
      const updateData: Partial<BlogPost> = {};
      
      // Only include fields that have actual values or have been modified
      if (formData.title) updateData.title = formData.title;
      if (formData.author) updateData.author = formData.author;
      if (formData.excerpt) updateData.excerpt = formData.excerpt;
      if (formData.generator) updateData.generator = formData.generator;
      if (formData.content_html) updateData.content_html = formData.content_html;
      if (formData.content_hash) updateData.content_hash = formData.content_hash;
      
      // Always update these fields if they have values
      if (formData.tags.length > 0) updateData.tags = formData.tags;
      if (formData.labels.length > 0) updateData.labels = formData.labels;
      if (formData.access_type) updateData.access_type = formData.access_type;
      if (formData.status) updateData.status = formData.status;
      if (Object.keys(formData.metadata).length > 0) updateData.metadata = formData.metadata;
      
      // Image URLs
      if (thumbnailUrl) updateData.thumbnail_url = thumbnailUrl;
      if (coverUrl) updateData.cover_url = coverUrl;
      
      // Additional fields
      if (slug) updateData.slug = slug;
      if (formData.link) updateData.link = formData.link;
      if (formData.language) updateData.language = formData.language;
      if (formData.web_master) updateData.web_master = formData.web_master;
      if (formData.published_at) updateData.published_at = formData.published_at;
      
      // Always update timestamp
      updateData.updated_at = new Date().toISOString();


      // Use regular update to save only changed fields
      await BlogService.updateBlog(blog.id, updateData);
      
      toast({
        title: "Success",
        description: "Blog updated successfully",
      });
      
      onUpdate();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update blog",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      const updatedTags = [...formData.tags, newTag.trim()];
      setFormData({
        ...formData,
        tags: updatedTags
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const addLabel = () => {
    if (newLabel.trim() && !formData.labels.includes(newLabel.trim())) {
      const updatedLabels = [...formData.labels, newLabel.trim()];
      setFormData({
        ...formData,
        labels: updatedLabels
      });
      setNewLabel('');
    }
  };

  const removeLabel = (labelToRemove: string) => {
    setFormData({
      ...formData,
      labels: formData.labels.filter(label => label !== labelToRemove)
    });
  };

  const addMetadata = () => {
    if (newMetadataKey.trim() && newMetadataValue.trim()) {
      setFormData({
        ...formData,
        metadata: {
          ...formData.metadata,
          [newMetadataKey.trim()]: newMetadataValue.trim()
        }
      });
      setNewMetadataKey('');
      setNewMetadataValue('');
    }
  };

  const removeMetadata = (keyToRemove: string) => {
    const newMetadata = { ...formData.metadata };
    delete newMetadata[keyToRemove];
    setFormData({
      ...formData,
      metadata: newMetadata
    });
  };

  const validateImageFile = (file: File, type: 'thumbnail' | 'cover') => {
    const maxSize = type === 'thumbnail' ? 2 * 1024 * 1024 : 5 * 1024 * 1024; // 2MB for thumbnail, 5MB for cover
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Please upload a valid image file (JPEG, PNG, or WebP)`);
    }
    
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      throw new Error(`File size must be less than ${maxSizeMB}MB`);
    }
    
    return true;
  };

  const validateImageDimensions = (file: File, type: 'thumbnail' | 'cover'): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        
        if (type === 'thumbnail') {
          // Thumbnail: 300x300 to 800x800, square aspect ratio
          if (width !== height) {
            reject(new Error('Thumbnail image must be square (same width and height)'));
            return;
          }
          if (width < 300 || width > 800) {
            reject(new Error('Thumbnail image must be between 300x300 and 800x800 pixels'));
            return;
          }
        } else {
          // Cover: 1200x630 to 1920x1080, 16:9 aspect ratio preferred
          const aspectRatio = width / height;
          const targetRatio = 16 / 9;
          const tolerance = 0.1;
          
          if (Math.abs(aspectRatio - targetRatio) > tolerance) {
            reject(new Error('Cover image should have a 16:9 aspect ratio (e.g., 1200x675, 1920x1080)'));
            return;
          }
          if (width < 1200 || height < 630) {
            reject(new Error('Cover image must be at least 1200x630 pixels'));
            return;
          }
          if (width > 1920 || height > 1080) {
            reject(new Error('Cover image should not exceed 1920x1080 pixels'));
            return;
          }
        }
        
        resolve(true);
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (file: File, type: 'thumbnail' | 'cover') => {
    try {
      setUploading(true);
      
      // Validate file type and size
      validateImageFile(file, type);
      
      // Validate dimensions
      await validateImageDimensions(file, type);
      
      // Check if user is authenticated
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      if (!auth.currentUser) {
        throw new Error('User not authenticated. Please sign in first.');
      }
      
      // Generate unique filename
      const fileName = StorageService.generateFileName(file.name);
      const storagePath = type === 'thumbnail' ? `thumbnails/${fileName}` : `covers/${fileName}`;
      
      // Upload to Firebase Storage
      const uploadedUrl = await StorageService.uploadImage(file, storagePath, type);
      
      // Update form data with the new URL
      if (type === 'thumbnail') {
        setFormData(prev => ({ ...prev, thumbnail_url: uploadedUrl }));
        setThumbnailFile(null); // Clear file state since it's uploaded
      } else {
        setFormData(prev => ({ ...prev, cover_url: uploadedUrl }));
        setCoverFile(null); // Clear file state since it's uploaded
      }
      
      toast({
        title: "Success",
        description: `${type === 'thumbnail' ? 'Thumbnail' : 'Cover'} image uploaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to upload ${type === 'thumbnail' ? 'thumbnail' : 'cover'} image. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isCreateMode ? 'Create New Blog Post' : 'Update Blog Post'}</DialogTitle>
          <DialogDescription>
            {isCreateMode 
              ? 'Create a new blog post with the P1/P2/P3 structure. All fields are required for new posts.'
              : 'Update the blog post with the new structure. Changes are saved only for modified fields.'
            }
          </DialogDescription>
        </DialogHeader>


        <div className="space-y-8">
          {/* Tags, Labels, Access Type, Status, Metadata */}
          <div className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button onClick={addTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Labels */}
              <div>
                <Label>Labels</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Add label"
                    onKeyPress={(e) => e.key === 'Enter' && addLabel()}
                  />
                  <Button onClick={addLabel} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {formData.labels.map((label, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {label}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeLabel(label)} />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="access_type">Access Type</Label>
                <Select
                  value={formData.access_type}
                  onValueChange={(value: 'premium' | 'free') => setFormData({...formData, access_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'draft' | 'approved' | 'archived') => setFormData({...formData, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Metadata */}
            <div>
              <Label>Metadata</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newMetadataKey}
                  onChange={(e) => setNewMetadataKey(e.target.value)}
                  placeholder="Key"
                />
                <Input
                  value={newMetadataValue}
                  onChange={(e) => setNewMetadataValue(e.target.value)}
                  placeholder="Value"
                />
                <Button onClick={addMetadata} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {Object.entries(formData.metadata).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="font-medium">{key}:</span>
                    <span>{value}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMetadata(key)}
                      className="ml-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Thumbnail, Cover, Author, Title, Excerpt, Generator */}
          <div className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Thumbnail Upload */}
              <div>
                <Label>Thumbnail Image</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'thumbnail')}
                      disabled={uploading}
                    />
                    {uploading && (
                      <div className="flex items-center gap-1 text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Uploading...
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Square image, 300x300 to 800x800 pixels, max 2MB (JPEG, PNG, WebP)
                  </p>
                  {formData.thumbnail_url && (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        Current: {formData.thumbnail_url.length > 50 
                          ? `${formData.thumbnail_url.substring(0, 50)}...` 
                          : formData.thumbnail_url}
                      </div>
                      <div className="w-20 h-20 border rounded overflow-hidden">
                        <img 
                          src={formData.thumbnail_url} 
                          alt="Thumbnail preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cover Upload */}
              <div>
                <Label>Cover Image</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'cover')}
                      disabled={uploading}
                    />
                    {uploading && (
                      <div className="flex items-center gap-1 text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Uploading...
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    16:9 aspect ratio, 1200x630 to 1920x1080 pixels, max 5MB (JPEG, PNG, WebP)
                  </p>
                  {formData.cover_url && (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        Current: {formData.cover_url.length > 50 
                          ? `${formData.cover_url.substring(0, 50)}...` 
                          : formData.cover_url}
                      </div>
                      <div className="w-32 h-20 border rounded overflow-hidden">
                        <img 
                          src={formData.cover_url} 
                          alt="Cover preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({...formData, author: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="generator">Generator</Label>
              <Input
                id="generator"
                value={formData.generator}
                onChange={(e) => setFormData({...formData, generator: e.target.value})}
                placeholder="Content generator (e.g., admin, substack)"
              />
            </div>
          </div>

          {/* Content Hash & HTML Content */}
          <div className="space-y-4">
            
            <div>
              <Label htmlFor="content_hash">Content Hash</Label>
              <Input
                id="content_hash"
                value={formData.content_hash}
                onChange={(e) => setFormData({...formData, content_hash: e.target.value})}
                placeholder="Content hash for versioning"
              />
            </div>

            <div>
              <AdvancedContentEditor
                value={formData.content_html}
                onChange={(value) => setFormData({...formData, content_html: value})}
                label="Content (HTML)"
                placeholder="Enter your content..."
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={loading}>
            {loading 
              ? (isCreateMode ? 'Creating...' : 'Updating...') 
              : (isCreateMode ? 'Create Blog' : 'Update Blog')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BlogUpdateModal;
