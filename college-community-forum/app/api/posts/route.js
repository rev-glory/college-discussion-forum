import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import { getCurrentUser } from '@/lib/auth';
import { sanitizeInput } from '@/lib/utils';

// GET /api/posts - List posts with filters and pagination
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const tag = searchParams.get('tag') || '';

    // Build filter
    const filter = {};
    
    if (query) {
      filter.$text = { $search: query };
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (tag) {
      filter.tags = tag;
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Post.countDocuments(filter);

    // Get posts with author info
    const posts = await Post.find(filter)
      .populate('authorId', 'name email branch year profilePic role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get comment counts for each post
    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ postId: post._id });
        return {
          ...post,
          author: post.authorId,
          likeCount: post.likes?.length || 0,
          commentCount,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          posts: postsWithCounts,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post
export async function POST(request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { title, content, tags, category } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedContent = sanitizeInput(content);
    const sanitizedCategory = category ? sanitizeInput(category) : '';
    const sanitizedTags = tags?.map(tag => sanitizeInput(tag)) || [];

    // Create post
    const post = await Post.create({
      authorId: currentUser.userId,
      title: sanitizedTitle,
      content: sanitizedContent,
      category: sanitizedCategory,
      tags: sanitizedTags,
    });

    // Populate author info
    await post.populate('authorId', 'name email branch year profilePic role');

    return NextResponse.json(
      {
        success: true,
        data: {
          post: {
            ...post.toObject(),
            author: post.authorId,
            likeCount: 0,
            commentCount: 0,
          },
        },
        message: 'Post created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create post' },
      { status: 500 }
    );
  }
}
