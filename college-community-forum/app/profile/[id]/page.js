'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { User as UserIcon, Mail, BookOpen, Calendar, Edit } from 'lucide-react';
import PostCard from '@/components/PostCard';
import { useAuth } from '@/components/AuthProvider';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const params = useParams();
  const resolvedParams = { id: params.id };
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, [resolvedParams.id]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${resolvedParams.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'User not found');
      }

      setProfile(data.data.user);
      setPosts(data.data.posts);
      setEditData({
        name: data.data.user.name,
        bio: data.data.user.bio || '',
        branch: data.data.user.branch || '',
        year: data.data.user.year || '',
      });
    } catch (error) {
      toast.error(error.message);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/users/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update profile');
      }

      toast.success('Profile updated successfully');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeletePost = (postId) => {
    setPosts(posts.filter(post => post._id !== postId));
  };

  if (loading) {
    return (
      <div className="container-custom py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) return null;

  const isOwnProfile = currentUser && currentUser.id === resolvedParams.id;

  return (
    <div className="container-custom py-8">
      <div className="max-w-5xl mx-auto">
        {/* Profile Card */}
        <div className="card-custom p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center">
                <UserIcon className="w-16 h-16 text-primary" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              {!isEditing ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold">{profile.name}</h1>
                      <p className="text-muted-foreground capitalize">
                        {profile.role}
                      </p>
                    </div>
                    {isOwnProfile && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit Profile</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>{profile.email}</span>
                    </div>
                    {profile.branch && (
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4" />
                        <span>{profile.branch}</span>
                      </div>
                    )}
                    {profile.year && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Year {profile.year}</span>
                      </div>
                    )}
                  </div>

                  {profile.bio && (
                    <p className="mt-4 text-sm">{profile.bio}</p>
                  )}
                </>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Bio</label>
                    <textarea
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      className="input-field resize-none"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Branch</label>
                    <input
                      type="text"
                      value={editData.branch}
                      onChange={(e) => setEditData({ ...editData, branch: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  {profile.role === 'student' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Year</label>
                      <select
                        value={editData.year}
                        onChange={(e) => setEditData({ ...editData, year: e.target.value })}
                        className="input-field"
                      >
                        <option value="">Select Year</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                      </select>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary">
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* User Posts */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            Posts ({posts.length})
          </h2>
          {posts.length === 0 ? (
            <div className="card-custom p-12 text-center">
              <p className="text-muted-foreground">No posts yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} onDelete={handleDeletePost} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
