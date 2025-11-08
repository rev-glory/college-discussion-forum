import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { generateToken, createAuthCookie } from '@/lib/auth';
import { isValidEmail, sanitizeInput } from '@/lib/utils';

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, email, password, branch, year, role } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedBranch = branch ? sanitizeInput(branch) : '';

    // Check if user already exists
    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name: sanitizedName,
      email: sanitizedEmail,
      passwordHash,
      branch: sanitizedBranch,
      year: year || undefined,
      role: role === 'faculty' ? 'faculty' : 'student', // Default to student, allow faculty
    });

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email, user.role);

    // Create response with cookie
    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            branch: user.branch,
            year: user.year,
          },
        },
        message: 'Registration successful',
      },
      { status: 201 }
    );

    // Set auth cookie
    response.headers.set('Set-Cookie', createAuthCookie(token));

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Registration failed. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
