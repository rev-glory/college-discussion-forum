'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PenSquare } from 'lucide-react';

export default function CreatePostPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          tags: tagsArray,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create post');
      }

      toast.success('Post created successfully!');
      router.push(`/post/${data.data.post._id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container-custom py-12 text-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container-custom py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <PenSquare className="w-8 h-8" />
            Create New Post
          </h1>
          <p className="text-muted-foreground mt-2">
            Share your thoughts with the community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card-custom p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="Enter a descriptive title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content *</label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="input-field min-h-[200px] resize-none"
              placeholder="Write your post content here..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-field"
            >
              <option value="">Select a category</option>
              <option value="Academic">Academic</option>
              <option value="Events">Events</option>
              <option value="Clubs">Clubs</option>
              <option value="General">General</option>
              <option value="Help">Help</option>
              <option value="Announcements">Announcements</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="input-field"
              placeholder="Enter tags separated by commas (e.g., programming, help, project)"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Add up to 10 tags to help others find your post
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Post'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
