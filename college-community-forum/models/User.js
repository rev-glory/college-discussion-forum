import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email',
    ],
  },
  passwordHash: {
    type: String,
    required: [true, 'Please provide a password'],
  },
  branch: {
    type: String,
    trim: true,
    maxlength: [100, 'Branch cannot be more than 100 characters'],
  },
  year: {
    type: Number,
    min: [1, 'Year must be at least 1'],
    max: [5, 'Year cannot be more than 5'],
  },
  role: {
    type: String,
    enum: ['student', 'faculty', 'admin'],
    default: 'student',
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters'],
  },
  profilePic: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster email lookups
UserSchema.index({ email: 1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);
