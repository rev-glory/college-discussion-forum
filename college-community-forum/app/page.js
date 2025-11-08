'use client';

import { useState, useEffect } from 'react';
import PostCard from '@/components/PostCard';
import { Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPosts();
  }, [page, searchQuery, category]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (searchQuery) params.append('q', searchQuery);
      if (category) params.append('category', category);

      const response = await fetch(`/api/posts?${params}`);
      const data = await response.json();

      if (data.success) {
        setPosts(data.data.posts);
        setTotalPages(data.data.pagination.pages);
      }
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  const handleDelete = (postId) => {
    setPosts(posts.filter(post => post._id !== postId));
  };

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">College Community Forum</h1>
        <p className="text-muted-foreground">
          Connect, share, and learn with your college community
        </p>
      </div>

      {/* Search & Filters */}
      <div className="card-custom p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="input-field"
          >
            <option value="">All Categories</option>
            <option value="Academic">Academic</option>
            <option value="Events">Events</option>
            <option value="Clubs">Clubs</option>
            <option value="General">General</option>
            <option value="Help">Help</option>
          </select>
          <button type="submit" className="btn-primary">
            <Filter className="w-4 h-4 inline mr-2" />
            Filter
          </button>
        </form>
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="card-custom p-12 text-center">
          <p className="text-muted-foreground text-lg">No posts found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Be the first to create a post!
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} onDelete={handleDelete} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
