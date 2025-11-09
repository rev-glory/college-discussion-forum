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
    const query = searchParams.get('query') || '';
    if (!query) return NextResponse.json({ posts: [] });

    const apiKey = process.env.GEMINI_API_KEY;
    await dbConnect();

    let queryEmbedding = [];
    if (apiKey) {
      const er = await fetch('https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({ content: { parts: [{ text: query.slice(0, 8000) }] } })
      });
      if (er.ok) {
        const ej = await er.json();
        queryEmbedding = ej?.embedding?.values || [];
      }
    }

    // If no API key or embedding failed, fallback to text search
    if (!apiKey || !queryEmbedding.length) {
      const fallbackPosts = await Post.find({ $text: { $search: query } })
        .sort({ createdAt: -1 }).limit(20)
        .populate('authorId', 'name branch').lean();
      return NextResponse.json({ posts: fallbackPosts.map(p=>({ ...p, author: p.authorId })) });
    }

    // Pull recent posts (could be all, but cap to reduce CPU)
    const posts = await Post.find({}, { title:1, content:1, tags:1, category:1, createdAt:1, authorId:1, embedding:1 })
      .sort({ createdAt: -1 }).limit(500).populate('authorId','name branch').lean();

    const scored = posts.map(p => ({
      post: { ...p, author: p.authorId },
      score: cosineSim(queryEmbedding, p.embedding || [])
    })).sort((a,b)=>b.score-a.score).slice(0, 20).map(s=>s.post);

    return NextResponse.json({ posts: scored });
  } catch (error) {
    return NextResponse.json({ posts: [] });
  }
}
