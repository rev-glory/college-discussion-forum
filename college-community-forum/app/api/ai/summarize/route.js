import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import { GoogleGenAI } from '@google/genai';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const ai = new GoogleGenAI({});

export async function POST(request) {
  try {
    const { postId } = await request.json();
    if (!postId) return NextResponse.json({ message: 'Missing postId' }, { status: 400 });

    await dbConnect();
    const post = await Post.findById(postId).lean();
    if (!post) return NextResponse.json({ message: 'Post not found' }, { status: 404 });

    const comments = await Comment.find({ postId }).sort({ createdAt: -1 }).limit(15).lean();

    if (!process.env.GEMINI_API_KEY) {
      // Fallback: simple short excerpt
      const base = `${post.title}. ${post.content}`.slice(0, 240);
      return NextResponse.json({ summary: base + (post.content.length > 240 ? '…' : '') });
    }

    const prompt = `Summarize the following forum post and key comments into a concise, neutral TL;DR (2-4 sentences).\n\nTitle: ${post.title}\nCategory: ${post.category || 'General'}\nTags: ${post.tags?.join(', ') || 'None'}\n\nPost:\n${post.content}\n\nRecent comments:\n${comments.map(c=>`- ${c.content}`).join('\n')}`;

    const res = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      generationConfig: { temperature: 0.3, maxOutputTokens: 220 },
    });

    const summary = (typeof res.text === 'string' ? res.text : '').trim();
    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to summarize' }, { status: 500 });
  }
}
