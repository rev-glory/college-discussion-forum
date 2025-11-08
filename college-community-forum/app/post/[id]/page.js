'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, User as UserIcon, ArrowLeft } from 'lucide-react';
import CommentSection from '@/components/CommentSection';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import toast from 'react-hot-toast';

export default function PostDetailPage() {
  const params = useParams();
  const resolvedParams = { id: params.id };
  const { user } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    fetchPost();
  }, [resolvedParams.id]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${resolvedParams.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Post not found');
      }

      setPost(data.data.post);
      setLikeCount(data.data.post.likeCount);
      
      // Check if current user liked the post
      if (user && data.data.post.likes) {
        setLiked(data.data.post.likes.includes(user.id));
      }
    } catch (error) {
      toast.error(error.message);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like posts');
      return;
    }

    const newLiked = !liked;
    const newCount = newLiked ? likeCount + 1 : likeCount - 1;

    setLiked(newLiked);
    setLikeCount(newCount);

    try {
      const response = await fetch(`/api/posts/${resolvedParams.id}/like`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to like post');

      const data = await response.json();
      setLiked(data.data.liked);
      setLikeCount(data.data.likeCount);
    } catch (error) {
      setLiked(!newLiked);
      setLikeCount(newLiked ? newCount - 1 : newCount + 1);
      toast.error('Failed to like post');
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="container-custom py-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Post Content */}
        <article className="card-custom p-8 mb-6">
          {/* Author Info */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <Link
                href={`/profile/${post.author._id}`}
                className="font-semibold text-lg hover:text-primary transition-colors"
              >
                {post.author.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                {post.author.branch} • {formatDate(post.createdAt)}
              </p>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

          {/* Tags & Category */}
          <div className="flex flex-wrap gap-2 mb-6">
            {post.category && (
              <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                {post.category}
              </span>
            )}
            {post.tags?.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none mb-6">
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-6 pt-6 border-t border-border">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 hover:text-red-500 transition-colors ${
                liked ? 'text-red-500' : 'text-muted-foreground'
              }`}
            >
              <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
              <span className="font-medium">{likeCount}</span>
            </button>
          </div>
        </article>

        {/* Comments Section */}
        <CommentSection postId={resolvedParams.id} initialComments={post.comments || []} />
      </div>
    </div>
  );
}
