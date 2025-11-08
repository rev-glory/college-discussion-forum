import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'Post ID is required'],
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author ID is required'],
  },
  content: {
    type: String,
    required: [true, 'Please provide content'],
    maxlength: [1000, 'Comment cannot be more than 1000 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better query performance
CommentSchema.index({ postId: 1, createdAt: -1 });
CommentSchema.index({ authorId: 1 });

export default mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
