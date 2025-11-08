import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Post from '@/models/Post';
import { getCurrentUser } from '@/lib/auth';

// POST /api/posts/[id]/like - Toggle like on a post
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

    // Find post
    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user already liked the post
    const likeIndex = post.likes.findIndex(
      (userId) => userId.toString() === currentUser.userId
    );

    let liked = false;

    if (likeIndex > -1) {
      // Unlike: remove user from likes array
      post.likes.splice(likeIndex, 1);
      liked = false;
    } else {
      // Like: add user to likes array
      post.likes.push(currentUser.userId);
      liked = true;
    }

    await post.save();

    return NextResponse.json(
      {
        success: true,
        data: {
          liked,
          likeCount: post.likes.length,
        },
        message: liked ? 'Post liked' : 'Post unliked',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Like post error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to like/unlike post' },
      { status: 500 }
    );
  }
}
