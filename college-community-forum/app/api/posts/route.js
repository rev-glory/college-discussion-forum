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

    // Moderation check (optional)
    try {
      if (process.env.OPENAI_API_KEY) {
        const mres = await fetch('https://api.openai.com/v1/moderations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
          body: JSON.stringify({ model: 'omni-moderation-latest', input: `${title}\n\n${content}`.slice(0,5000) }),
        });
        if (mres.ok) {
          const mj = await mres.json();
          const flagged = mj?.results?.[0]?.flagged;
          if (flagged) {
            return NextResponse.json(
              { success: false, message: 'Content not allowed by moderation' },
              { status: 400 }
            );
          }
        }
      }
    } catch (_) { /* graceful: allow post if moderation unavailable */ }

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

    // Try to enrich with embedding (optional)
    try {
      if (process.env.OPENAI_API_KEY) {
        const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: `${sanitizedTitle}\n\n${sanitizedContent}`.slice(0, 8000),
          }),
        });
        if (embedRes.ok) {
          const embedData = await embedRes.json();
          const vector = embedData?.data?.[0]?.embedding || [];
          if (Array.isArray(vector) && vector.length) {
            post.embedding = vector;
            await post.save();
          }
        }
      }
    } catch (_) { /* ignore embedding errors */ }

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
