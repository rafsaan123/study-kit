'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import ProfileImageUpload from '../components/ProfileImageUpload';
import PasswordChange from '../components/PasswordChange';
import Image from 'next/image';

interface StudentProfile {
  name: string;
  studentId: string;
  email: string;
  session: string;
  department: string;
  regulation: number;
  phone: string;
  address: string;
  guardianName: string;
  guardianPhone: string;
  profileImage?: string;
}

export default function ProfilePage() {
  const { session } = useAuth(true);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  useEffect(() => {
    if (session?.user) {
      console.log('Session exists, fetching profile');
      fetchProfile();
    } else {
      console.log('No session yet');
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      console.log('Fetching profile for user:', session?.user);
      const response = await fetch('/api/student/profile');
      console.log('Profile API Response:', response);

      if (response.ok) {
        const data = await response.json();
        console.log('Profile Data:', data);
        setProfile(data);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push(session?.user.userType === 'student' ? '/dashboard' : '/teacher-dashboard')}
                  className="bg-gray-100 p-2 rounded-md hover:bg-gray-200 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
              </div>
              <div className="flex items-center space-x-2">
                {session?.user.userType === 'student' && (
                  <>
                    <button
                      onClick={() => setShowPasswordChange(!showPasswordChange)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
                    >
                      Change Password
                    </button>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        isEditing
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {isEditing ? 'Cancel' : 'Edit Profile'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Message display */}
          {message.text && (
            <div
              className={`px-6 py-4 ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Main Content */}
          <div className="px-6 py-4">
            {/* Profile Image */}
            <div className="mb-8 flex justify-center">
              <ProfileImageUpload
                currentImage={profile?.profileImage}
                onUpload={(imageUrl) => setProfile(prev => ({ ...prev!, profileImage: imageUrl }))}
              />
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={profile?.name || ''}
                      disabled={true}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {session?.user.userType === 'student' ? 'Student ID' : 'Email'}
                    </label>
                    <input
                      type="text"
                      value={session?.user.userType === 'student' ? (profile?.studentId || '') : (session?.user.email || '')}
                      disabled={true}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                    />
                  </div>

                  {session?.user.userType === 'student' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Session</label>
                        <input
                          type="text"
                          value={profile?.session || ''}
                          disabled={true}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Department</label>
                        <input
                          type="text"
                          value={profile?.department || ''}
                          disabled={true}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Regulation</label>
                        <input
                          type="text"
                          value={profile?.regulation || ''}
                          disabled={true}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Contact Information Section */}
                {session?.user.userType === 'student' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="tel"
                        value={profile?.phone || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev!, phone: e.target.value }))}
                        disabled={!isEditing}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200 ${
                          !isEditing && 'bg-gray-50'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <textarea
                        value={profile?.address || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev!, address: e.target.value }))}
                        disabled={!isEditing}
                        rows={3}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200 ${
                          !isEditing && 'bg-gray-50'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Guardian Name</label>
                      <input
                        type="text"
                        value={profile?.guardianName || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev!, guardianName: e.target.value }))}
                        disabled={!isEditing}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200 ${
                          !isEditing && 'bg-gray-50'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Guardian Phone</label>
                      <input
                        type="tel"
                        value={profile?.guardianPhone || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev!, guardianPhone: e.target.value }))}
                        disabled={!isEditing}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200 ${
                          !isEditing && 'bg-gray-50'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              {isEditing && (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </form>

            {/* Password Change Section */}
            {showPasswordChange && session?.user.userType === 'student' && (
              <div className="mt-8">
                <PasswordChange />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}