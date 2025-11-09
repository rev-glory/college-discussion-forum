import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Post from '@/models/Post';

function cosineSim(a = [], b = []) {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    await dbConnect();

    // Pull some recent posts
    const recent = await Post.find({}).sort({ createdAt: -1 }).limit(300).populate('authorId','name branch').lean();

    if (!userId) {
      // Anonymous: return recent popular (by like count)
      const ranked = recent
        .map(p => ({ p, likes: (p.likes?.length)||0 }))
        .sort((a,b)=>b.likes-a.likes)
        .slice(0,10)
        .map(x=>x.p);
      return NextResponse.json({ posts: ranked });
    }

    // Build user profile from liked posts and tags
    const likedPosts = recent.filter(p => (p.likes||[]).some(id => id?.toString() === userId));
    const tagCounts = new Map();
    likedPosts.forEach(p => (p.tags||[]).forEach(t => tagCounts.set(t, (tagCounts.get(t)||0)+1)));
    const topTags = Array.from(tagCounts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([t])=>t);

    // Score by tag overlap
    let scored = recent.map(p => {
      const overlap = (p.tags||[]).filter(t => topTags.includes(t)).length;
      return { p, score: overlap };
    });

    // If embeddings available and key set, refine by vector similarity to a profile string
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      const profileText = likedPosts.map(p=>`${p.title}. ${p.content}` ).join('\n').slice(0, 8000) || topTags.join(', ');
      if (profileText) {
        try {
          const er = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model: 'text-embedding-3-small', input: profileText })
          });
          if (er.ok) {
            const ej = await er.json();
            const userVec = ej?.data?.[0]?.embedding || [];
            scored = recent.map(p => ({ p, score: (scored.find(s=>s.p._id.toString()===p._id.toString())?.score||0) + 2*(cosineSim(userVec, p.embedding||[])) }));
          }
        } catch {}
      }
    }

    const ranked = scored.sort((a,b)=>b.score-a.score).slice(0,10).map(x=>x.p);
    return NextResponse.json({ posts: ranked });
  } catch (error) {
    return NextResponse.json({ posts: [] });
  }
}
