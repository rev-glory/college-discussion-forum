'use client';

import Link from 'next/link';
import { Heart, MessageCircle, User as UserIcon, Trash2, Edit } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from './AuthProvider';
import toast from 'react-hot-toast';

export default function PostCard({ post, onDelete, onLike }) {
  const { user } = useAuth();
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [liked, setLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to like posts');
      return;
    }

    if (isLiking) return;

    setIsLiking(true);
    const newLiked = !liked;
    const newCount = newLiked ? likeCount + 1 : likeCount - 1;

    // Optimistic update
    setLiked(newLiked);
    setLikeCount(newCount);

    try {
      const response = await fetch(`/api/posts/${post._id}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to like post');
      }

      const data = await response.json();
      setLiked(data.data.liked);
      setLikeCount(data.data.likeCount);

      if (onLike) {
        onLike(post._id, data.data.liked);
      }
    } catch (error) {
      // Revert on error
      setLiked(!newLiked);
      setLikeCount(newLiked ? newCount - 1 : newCount + 1);
      toast.error('Failed to like post');
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      toast.success('Post deleted successfully');
      if (onDelete) {
        onDelete(post._id);
      }
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const canModify = user && (user.id === post.authorId?._id?.toString() || user.role === 'admin');

  return (
    <div className="card-custom p-6 hover:shadow-md transition-shadow">
      <Link href={`/post/${post._id}`}>
        {/* Author Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Link
                href={`/profile/${post.authorId?._id || post.author?._id}`}
                className="font-semibold hover:text-primary transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {post.authorId?.name || post.author?.name || 'Unknown'}
              </Link>
              <p className="text-sm text-muted-foreground">
                {post.authorId?.branch || post.author?.branch} • {formatDate(post.createdAt)}
              </p>
            </div>
          </div>

          {/* Actions */}
          {canModify && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-destructive/10 rounded-md text-destructive transition-colors"
                aria-label="Delete post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Post Content */}
        <h2 className="text-xl font-bold mb-2 hover:text-primary transition-colors">
          {post.title}
        </h2>
        <p className="text-muted-foreground mb-4 line-clamp-3">{post.content}</p>

        {/* Tags & Category */}
        <div className="flex flex-wrap gap-2 mb-4">
          {post.category && (
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
              {post.category}
            </span>
          )}
          {post.tags?.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-6 text-muted-foreground">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 hover:text-red-500 transition-colors ${
              liked ? 'text-red-500' : ''
            }`}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            <span>{likeCount}</span>
          </button>
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>{post.commentCount || 0}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
