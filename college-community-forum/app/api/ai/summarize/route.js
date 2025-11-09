import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Post from '@/models/Post';
import Comment from '@/models/Comment';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export async function POST(request) {
  try {
    const { postId } = await request.json();
    if (!postId) return NextResponse.json({ message: 'Missing postId' }, { status: 400 });

    await dbConnect();
    const post = await Post.findById(postId).lean();
    if (!post) return NextResponse.json({ message: 'Post not found' }, { status: 404 });

    const comments = await Comment.find({ postId }).sort({ createdAt: -1 }).limit(15).lean();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback: simple short excerpt
      const base = `${post.title}. ${post.content}`.slice(0, 240);
      return NextResponse.json({ summary: base + (post.content.length > 240 ? '…' : '') });
    }

    const convo = [
      { role: 'system', content: 'You summarize forum threads into concise, neutral TL;DRs (2-4 sentences).' },
      { role: 'user', content: `Summarize the following post and key comments into a short TL;DR.

Title: ${post.title}
Category: ${post.category || 'General'}
Tags: ${post.tags?.join(', ') || 'None'}

Post:
${post.content}

Recent comments:
${comments.map(c=>`- ${c.content}`).join('\n')}` }
    ];

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: MODEL, messages: convo, temperature: 0.3, max_tokens: 220 })
    });

    if (!res.ok) return NextResponse.json({ message: 'AI service error' }, { status: 502 });
    const data = await res.json();
    const summary = data?.choices?.[0]?.message?.content?.trim() || '';
    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to summarize' }, { status: 500 });
  }
}
