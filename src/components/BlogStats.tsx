import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, Eye, EyeOff } from 'lucide-react';
import { BlogService, BlogPost } from '@/lib/blogService';

const BlogStats = () => {
  const [stats, setStats] = useState({
    totalBlogs: 0,
    activeBlogs: 0,
    premiumBlogs: 0,
    freeBlogs: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [allBlogs, activeBlogs, premiumBlogs, freeBlogs] = await Promise.all([
          BlogService.getAllBlogs(),
          BlogService.getActiveBlogs(),
          BlogService.getBlogsByAccessType('premium'),
          BlogService.getBlogsByAccessType('free')
        ]);

        setStats({
          totalBlogs: allBlogs.length,
          activeBlogs: activeBlogs.length,
          premiumBlogs: premiumBlogs.length,
          freeBlogs: freeBlogs.length
        });
      } catch (error) {
        // Silent error handling
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Blogs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Blogs</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBlogs}</div>
          <p className="text-xs text-muted-foreground">
            Existing blog posts in Firestore
          </p>
        </CardContent>
      </Card>

      {/* Active Blogs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Blogs</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.activeBlogs}</div>
          <p className="text-xs text-muted-foreground">
            Currently published and visible
          </p>
        </CardContent>
      </Card>

      {/* Premium Blogs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Premium Blogs</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.premiumBlogs}</div>
          <p className="text-xs text-muted-foreground">
            Premium content requiring subscription
          </p>
        </CardContent>
      </Card>

      {/* Free Blogs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Free Blogs</CardTitle>
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.freeBlogs}</div>
          <p className="text-xs text-muted-foreground">
            Publicly accessible content
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlogStats;
