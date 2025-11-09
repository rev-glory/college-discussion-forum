'use client';

import { useState, useEffect } from 'react';
import { User as UserIcon, Send, Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAuth } from './AuthProvider';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function CommentSection({ postId, initialComments }) {
  const { user } = useAuth();
  const [comments, setComments] = useState(initialComments || []);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiImproved, setAiImproved] = useState('');
  const [showImprove, setShowImprove] = useState(false);
  const [smartEnabled, setSmartEnabled] = useState(false);
  const [ghostText, setGhostText] = useState('');

  useEffect(() => {
    if (!smartEnabled) { setGhostText(''); return; }
    if (!content || content.length < 12) { setGhostText(''); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/ai/improveText', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `Continue this thought in a short friendly way: ${content}` })
        });
        if (!res.ok) return;
        const data = await res.json();
        setGhostText(data.improvedText?.slice(0, 100) || '');
      } catch (_) {}
    }, 500);
    return () => clearTimeout(t);
  }, [content, smartEnabled]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    if (!content.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const data = await response.json();
      setComments([data.data.comment, ...comments]);
      setContent('');
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      {user && (
        <form onSubmit={handleSubmit} className="card-custom p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            className="input-field min-h-[100px] resize-none"
            disabled={isSubmitting}
          />
          {smartEnabled && ghostText && (
            <div className="text-xs text-muted-foreground mt-1">Suggestion: {ghostText}</div>
          )}
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch('/api/ai/improveText', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: content }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.message || 'AI failed');
                  setAiImproved(data.improvedText || '');
                  setShowImprove(true);
                } catch (_) { toast.error('AI unavailable'); }
              }}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4"/> Improve with AI
            </button>
            <label className="inline-flex items-center gap-2 text-sm ml-auto">
              <input type="checkbox" checked={smartEnabled} onChange={(e)=>setSmartEnabled(e.target.checked)} />
              Enable Smart Suggestions
            </label>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Posting...' : 'Post Comment'}</span>
            </button>
          </div>

          {showImprove && (
            <div className="mt-3 p-3 rounded-md border border-border">
              <div className="text-xs font-medium mb-2">AI Suggestion</div>
              <div className="text-sm whitespace-pre-wrap">{aiImproved}</div>
              <div className="flex gap-2 justify-end mt-2">
                <button className="btn-secondary btn-sm" onClick={()=>setShowImprove(false)}>Dismiss</button>
                <button className="btn-primary btn-sm" onClick={()=>{ setContent(aiImproved); setShowImprove(false); }}>Apply</button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Comments ({comments.length})
        </h3>
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="card-custom p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Link
                      href={`/profile/${comment.authorId?._id || comment.author?._id}`}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {comment.authorId?.name || comment.author?.name}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
