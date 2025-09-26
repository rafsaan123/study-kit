'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProfileImageUploadProps {
  currentImage?: string;
  onUpload: (imageUrl: string) => void;
}

export default function ProfileImageUpload({ currentImage, onUpload }: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      onUpload(data.files[0].fileUrl);
    } catch (error) {
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative h-32 w-32 rounded-full overflow-hidden bg-gray-100">
        {currentImage ? (
          <Image
            src={currentImage}
            alt="Profile"
            fill
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400">
            <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </div>

      <label className="cursor-pointer">
        <span className={`inline-block px-4 py-2 rounded-md text-sm font-medium ${
          uploading
            ? 'bg-gray-300 text-gray-500'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}>
          {uploading ? 'Uploading...' : 'Change Photo'}
        </span>
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
        />
      </label>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}