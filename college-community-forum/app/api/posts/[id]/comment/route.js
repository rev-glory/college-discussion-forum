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
