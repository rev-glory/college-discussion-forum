'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PenSquare, Sparkles, Tag } from 'lucide-react';

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
  const [aiImproved, setAiImproved] = useState('');
  const [showImprove, setShowImprove] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [smartEnabled, setSmartEnabled] = useState(false);
  const [ghostText, setGhostText] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Simple smart compose: debounced suggest continuation
  useEffect(() => {
    if (!smartEnabled) { setGhostText(''); return; }
    const text = formData.content;
    if (!text || text.length < 20) { setGhostText(''); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/ai/improveText', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `Continue this thought concisely: ${text}` }),
        });
        if (!res.ok) return;
        const data = await res.json();
        setGhostText(data.improvedText?.slice(0, 140) || '');
      } catch (_) {}
    }, 500);
    return () => clearTimeout(t);
  }, [formData.content, smartEnabled]);

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
              className="input-field min-h-[200px] resize-none relative"
              placeholder="Write your post content here..."
            />
            {smartEnabled && ghostText && (
              <div className="text-muted-foreground/60 text-sm mt-1">Suggestion: {ghostText}</div>
            )}
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/ai/improveText', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ text: formData.content }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'AI failed');
                    setAiImproved(data.improvedText || '');
                    setShowImprove(true);
                  } catch (e) {
                    toast.error('AI unavailable');
                  }
                }}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Improve with AI
              </button>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={smartEnabled} onChange={(e)=>setSmartEnabled(e.target.checked)} />
                Enable Smart Suggestions
              </label>
            </div>
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
            {suggestedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {suggestedTags.map((t) => (
                  <button key={t} type="button" onClick={() => {
                    const current = formData.tags ? formData.tags.split(',').map(s=>s.trim()).filter(Boolean) : [];
                    if (!current.includes(t)) {
                      setFormData({ ...formData, tags: [...current, t].join(', ') });
                    }
                  }} className="px-2 py-1 text-xs rounded-full bg-secondary hover:bg-secondary/80">
                    #{t}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch('/api/ai/suggestTags', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: formData.title, content: formData.content }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.message || 'AI failed');
                  setSuggestedTags(data.tags || []);
                } catch (_) { toast.error('AI unavailable'); }
              }}
              className="btn-secondary mt-2 inline-flex items-center gap-2"
            >
              <Tag className="w-4 h-4" /> Suggest tags
            </button>
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

        {/* AI Improve Modal */}
        {showImprove && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="card-custom p-6 max-w-xl w-full">
              <h3 className="font-semibold mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4"/> AI Suggestion</h3>
              <p className="text-sm whitespace-pre-wrap min-h-[100px]">
                {aiImproved || 'No suggestion available.'}
              </p>
              <div className="flex gap-2 justify-end mt-4">
                <button className="btn-secondary" onClick={()=>setShowImprove(false)}>Close</button>
                <button className="btn-primary" onClick={()=>{ setFormData({ ...formData, content: aiImproved }); setShowImprove(false); }}>Replace</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
