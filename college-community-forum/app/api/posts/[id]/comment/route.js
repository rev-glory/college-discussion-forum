import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import { getCurrentUser } from '@/lib/auth';
import { sanitizeInput } from '@/lib/utils';

// POST /api/posts/[id]/comment - Add a comment to a post
export async function POST(request, { params }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    // Validate required fields
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Post not found' },
        { status: 404 }
      );
    }

    // Sanitize input
    const sanitizedContent = sanitizeInput(content);

    // Moderation check (optional)
    try {
      if (process.env.GEMINI_API_KEY) {
        const prompt = `You are a strict content moderator for a college forum. Analyze the following text for policy violations (hate, harassment, sexual content with minors, extreme violence, self-harm instructions, and spam). Respond ONLY with compact JSON: {\"flagged\": true|false}.\n\nText:\n${sanitizedContent.slice(0,5000)}`;
        const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0, maxOutputTokens: 20 } })
        });
        if (resp.ok) {
          const data = await resp.json();
          const textOut = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const flagged = (()=>{ try { return !!JSON.parse(textOut).flagged; } catch { return false; } })();
          if (flagged) {
            return NextResponse.json(
              { success: false, message: 'Comment blocked by moderation' },
              { status: 400 }
            );
          }
        }
      }
    } catch (_) { /* allow if moderation unavailable */ }

    // Create comment
    const comment = await Comment.create({
      postId: id,
      authorId: currentUser.userId,
      content: sanitizedContent,
    });

    // Populate author info
    await comment.populate('authorId', 'name email branch year profilePic role');

    return NextResponse.json(
      {
        success: true,
        data: {
          comment: {
            ...comment.toObject(),
            author: comment.authorId,
          },
        },
        message: 'Comment added successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to add comment' },
      { status: 500 }
    );
  }
}
