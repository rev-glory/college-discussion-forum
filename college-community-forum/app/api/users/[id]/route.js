import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import { getCurrentUser, canModifyResource } from '@/lib/auth';
import { sanitizeInput } from '@/lib/utils';
import bcrypt from 'bcryptjs';

// GET /api/users/[id] - Get user profile and their posts
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;

    // Find user
    const user = await User.findById(id).select('-passwordHash').lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's posts with counts
    const posts = await Post.find({ authorId: id })
      .sort({ createdAt: -1 })
      .lean();

    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ postId: post._id });
        return {
          ...post,
          likeCount: post.likes?.length || 0,
          commentCount,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          user,
          posts: postsWithCounts,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user profile (protected, same user or admin)
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

    // Find user
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (!canModifyResource(currentUser, user._id)) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to update this profile' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, branch, year, bio, profilePic, password } = body;

    // Update allowed fields
    if (name) user.name = sanitizeInput(name);
    if (branch !== undefined) user.branch = sanitizeInput(branch);
    if (year !== undefined) user.year = year;
    if (bio !== undefined) user.bio = sanitizeInput(bio);
    if (profilePic !== undefined) user.profilePic = profilePic;

    // Update password if provided
    if (password && password.length >= 6) {
      const salt = await bcrypt.genSalt(12);
      user.passwordHash = await bcrypt.hash(password, salt);
    }

    await user.save();

    // Return user without password hash
    const userObject = user.toObject();
    delete userObject.passwordHash;

    return NextResponse.json(
      {
        success: true,
        data: { user: userObject },
        message: 'Profile updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
