import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import { getCurrentUser, canModifyResource } from '@/lib/auth';
import { sanitizeInput } from '@/lib/utils';

// GET /api/posts/[id] - Get single post with comments
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;

    const post = await Post.findById(id)
      .populate('authorId', 'name email branch year profilePic role')
      .lean();

    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Post not found' },
        { status: 404 }
      );
    }

    // Get comments for this post
    const comments = await Comment.find({ postId: id })
      .populate('authorId', 'name email branch year profilePic role')
      .sort({ createdAt: -1 })
      .lean();

    // Format response
    const formattedPost = {
      ...post,
      author: post.authorId,
      likeCount: post.likes?.length || 0,
      commentCount: comments.length,
      comments: comments.map(comment => ({
        ...comment,
        author: comment.authorId,
      })),
    };

    return NextResponse.json(
      {
        success: true,
        data: { post: formattedPost },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// PUT /api/posts/[id] - Update post (author only)
export async function PUT(request, { params }) {
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
    const { title, content, tags, category } = body;

    // Find post
    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Post not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (!canModifyResource(currentUser, post.authorId)) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to update this post' },
        { status: 403 }
      );
    }

    // Sanitize inputs
    const sanitizedTitle = title ? sanitizeInput(title) : post.title;
    const sanitizedContent = content ? sanitizeInput(content) : post.content;
    const sanitizedCategory = category !== undefined ? sanitizeInput(category) : post.category;
    const sanitizedTags = tags?.map(tag => sanitizeInput(tag)) || post.tags;

    // Update post
    post.title = sanitizedTitle;
    post.content = sanitizedContent;
    post.category = sanitizedCategory;
    post.tags = sanitizedTags;
    post.updatedAt = Date.now();

    await post.save();
    await post.populate('authorId', 'name email branch year profilePic role');

    const commentCount = await Comment.countDocuments({ postId: post._id });

    return NextResponse.json(
      {
        success: true,
        data: {
          post: {
            ...post.toObject(),
            author: post.authorId,
            likeCount: post.likes?.length || 0,
            commentCount,
          },
        },
        message: 'Post updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - Delete post (author or admin)
export async function DELETE(request, { params }) {
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

    // Find post
    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Post not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (!canModifyResource(currentUser, post.authorId)) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to delete this post' },
        { status: 403 }
      );
    }

    // Delete associated comments
    await Comment.deleteMany({ postId: id });

    // Delete post
    await Post.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: 'Post deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
