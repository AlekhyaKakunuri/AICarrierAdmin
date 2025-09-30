import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BlogService, BlogPost } from '@/lib/blogService';


import BlogUpdateModal from './BlogUpdateModal';
import RSSSyncButton from './RSSSyncButton';
import { Edit, Trash2, Search, Filter } from 'lucide-react';

const BlogManagement = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive' | 'premium' | 'free'>('all');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updatingBlog, setUpdatingBlog] = useState<BlogPost | null>(null);
  const [rssProcessedSlugs, setRssProcessedSlugs] = useState<{
    new_slugs: string[];
    updated_slugs: string[];
    skipped_slugs: string[];
    error_slugs: string[];
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-analyze RSS feed on page load (same as button click)
    const autoAnalyzeRSS = async () => {
      try {
        const { syncRSSFeed } = await import('./rss-sync');
        const result = await syncRSSFeed();
        
        if (result.success && result.processed_slugs) {
          // Store the processed slugs
          setRssProcessedSlugs(result.processed_slugs);
          
          // Show success message
          toast({
            title: "Auto RSS Analysis Complete",
            description: `Found ${result.processed_slugs.new_slugs.length} new, ${result.processed_slugs.updated_slugs.length} updated blogs`,
          });
        }
      } catch (error) {
        // Silent fail for auto-analysis, just fetch blogs normally
      }
      
      // Always fetch blogs after RSS analysis attempt
      await fetchBlogs();
    };
    
    autoAnalyzeRSS();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const blogsData = await BlogService.getAllBlogs();
      setBlogs(blogsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch blogs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterBlogs = useCallback(() => {
    let filtered = blogs;
    
    // RSS Processed Slugs filter (priority filter)
    if (rssProcessedSlugs) {
      const allProcessedSlugs = [
        ...rssProcessedSlugs.new_slugs,
        ...rssProcessedSlugs.updated_slugs,
        ...rssProcessedSlugs.skipped_slugs
      ];
      
      filtered = filtered.filter(blog => 
        blog.slug && allProcessedSlugs.includes(blog.slug)
      );
    }
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      
      filtered = filtered.filter(blog => {
        const titleMatch = blog.title && blog.title.toLowerCase().includes(searchLower);
        const slugMatch = blog.slug && blog.slug.toLowerCase().includes(searchLower);
        // Also check tags array
        const tagsMatch = blog.tags && Array.isArray(blog.tags) && 
          blog.tags.some(tag => tag.toLowerCase().includes(searchLower));
        
        const matches = titleMatch || slugMatch || tagsMatch;

        return matches;
      });
    }

    // Type filter
    switch (filterType) {
      case 'premium':
        filtered = filtered.filter(blog => blog.access_type === 'premium');
        break;
      case 'free':
        filtered = filtered.filter(blog => blog.access_type === 'free');
        break;
    }

    setFilteredBlogs(filtered);
  }, [blogs, searchTerm, filterType, rssProcessedSlugs]);

  useEffect(() => {
    filterBlogs();
  }, [filterBlogs]);

  const openEditDialog = (blog: BlogPost) => {
    // Use the new BlogUpdateModal instead of the old dialog
    setUpdatingBlog(blog);
    setIsUpdateModalOpen(true);
  };

  const handleRSSSyncComplete = async (result: any) => {
    if (result.success && result.processed_slugs) {
      // Store the processed slugs
      setRssProcessedSlugs(result.processed_slugs);
      
      // Refresh blogs to get latest data
      await fetchBlogs();
      
      toast({
        title: "RSS Analysis Complete",
        description: `Found ${result.processed_slugs.new_slugs.length} new, ${result.processed_slugs.updated_slugs.length} updated blogs`,
      });
    }
  };


  const formatDate = (dateInput: any) => {
    if (!dateInput) return 'N/A';
    // Convert to string if it's not already
    const dateString = String(dateInput);
    
    // Try to parse the date string
    let date: Date;
    
    // Handle different date formats
    if (dateString.includes('T') || dateString.includes('Z')) {
      // ISO format
      date = new Date(dateString);
    } else if (dateString.includes(',')) {
      // RFC 2822 format (e.g., "Wed, 02 Oct 2002 13:00:00 GMT")
      date = new Date(dateString);
    } else {
      // Try parsing as is
      date = new Date(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Blog Management</CardTitle>
          <CardDescription>Manage blog posts and content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">

      {/* Main Blog Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Blog Management</CardTitle>
            </div>
            <RSSSyncButton
              onSyncComplete={handleRSSSyncComplete}
              className="flex items-center gap-2"
            />
          </div>
        </CardHeader>

      <CardContent>
        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search blogs by title or slug..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Blogs</SelectItem>
              <SelectItem value="premium">Premium Only</SelectItem>
              <SelectItem value="free">Free Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Blogs Table */}
        <div className="space-y-4">
          {filteredBlogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {blogs.length === 0 ? 'No blogs found in database' : 'No blogs found matching your criteria'}
            </div>
          ) : (
            filteredBlogs.map((blog) => {
              // Determine RSS status for this blog
              let rssStatus = null;
              if (rssProcessedSlugs && blog.slug) {
                if (rssProcessedSlugs.new_slugs.includes(blog.slug)) {
                  rssStatus = { type: 'new', label: 'New', color: 'bg-green-100 text-green-800' };
                } else if (rssProcessedSlugs.updated_slugs.includes(blog.slug)) {
                  rssStatus = { type: 'updated', label: 'Updated', color: 'bg-blue-100 text-blue-800' };
                } else if (rssProcessedSlugs.skipped_slugs.includes(blog.slug)) {
                  rssStatus = { type: 'skipped', label: 'No Changes', color: 'bg-yellow-100 text-yellow-800' };
                }
              }

              return (
                <div key={blog.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{blog.title || 'Untitled'}</h3>
                        <Badge variant={blog.access_type === 'premium' ? "default" : "outline"}>
                          {blog.access_type}
                        </Badge>
                        {rssStatus && (
                          <Badge className={rssStatus.color}>
                            {rssStatus.label}
                          </Badge>
                        )}
                      </div>
                    <p className="text-sm text-gray-600 mb-2">{blog.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>By: {blog.author}</span>
                      <span>Published: {formatDate(blog.published_at || blog.created_at)}</span>
                      <span>Generator: {blog.generator || 'N/A'}</span>
                      {blog.labels && blog.labels.length > 0 && (
                        <div className="flex gap-1">
                          {blog.labels.map((label, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {label}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(blog)}
                      className="text-green-600 hover:text-green-700"
                      title="Edit Blog"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              );
            })
          )}
        </div>
      </CardContent>

      {/* Blog Update Modal */}
      <BlogUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        blog={updatingBlog}
        onUpdate={fetchBlogs}
        isCreateMode={!updatingBlog}
      />
      </Card>
    </div>
  );
};

export default BlogManagement;
