'use client';

import React, { useState } from 'react';
import FileUpload from './FileUpload';
import RoutineTable from './RoutineTable';

interface Attachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
}

export default function CreateContentForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [contentType, setContentType] = useState('notice');
  const [routineData, setRoutineData] = useState([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const currentYear = new Date().getFullYear();
  const sessions = [
    "All",
    `${currentYear}-${(currentYear + 1).toString().slice(-2)}`,
    `${currentYear-1}-${currentYear.toString().slice(-2)}`,
    `${currentYear-2}-${(currentYear-1).toString().slice(-2)}`,
    `${currentYear-3}-${(currentYear-2).toString().slice(-2)}`
  ];

  const departments = [
    'All',
    'Survey Technology',
    'Cadastral Topography And Land Information Technology',
    'Geoinformatics Technology'
  ];

  const handleFileSelect = (files: FileList | null) => {
    if (files) {
      setAttachments(Array.from(files));
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleRoutineChange = (data: any) => {
    setRoutineData(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // First, upload files if there are any
      let uploadedFiles = [];
      if (attachments.length > 0) {
        const uploadFormData = new FormData();
        attachments.forEach(file => {
          uploadFormData.append('files', file);
        });
        uploadFormData.append('folder', 'content-attachments');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'File upload failed');
        }

        const uploadResult = await uploadResponse.json();
        uploadedFiles = uploadResult.files;
      }

      // Then create the content with uploaded file information
      const contentFormData = new FormData();
      contentFormData.append('title', title);
      contentFormData.append('contentType', contentType);
      contentFormData.append('targetSession', selectedSession);
      contentFormData.append('targetDepartment', selectedDepartment);

      if (contentType === 'routine') {
        contentFormData.append('routineData', JSON.stringify(routineData));
      } else {
        contentFormData.append('content', content);
      }

      // Add file information
      contentFormData.append('attachments', JSON.stringify(uploadedFiles));

      const contentResponse = await fetch('/api/content', {
        method: 'POST',
        body: contentFormData,
      });

      if (!contentResponse.ok) {
        const errorData = await contentResponse.json();
        throw new Error(errorData.error || 'Failed to create content');
      }

      // Clear form
      setTitle('');
      setContent('');
      setSelectedSession('');
      setSelectedDepartment('All');
      setAttachments([]);
      setMessage({ type: 'success', text: 'Content created successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to create content' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Create New Content</h2>

      {message.text && (
        <div className={`mb-4 p-3 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Content Type Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Content Type
          </label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="notice">Notice</option>
            <option value="assignment">Assignment</option>
            <option value="routine">Class Routine</option>
            <option value="material">Study Material</option>
          </select>
        </div>

        {/* Session Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Session
          </label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
            disabled={isLoading}
          >
            <option value="">Select a session</option>
            {sessions.map(session => (
              <option key={session} value={session}>
                {session}
              </option>
            ))}
          </select>
        </div>

        {/* Department Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Department
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
            disabled={isLoading}
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
            disabled={isLoading}
          />
        </div>

        {/* Conditional Content Input */}
        {contentType === 'routine' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class Routine
            </label>
            <RoutineTable
              isEditing={true}
              initialData={[]}
              onDataChange={handleRoutineChange}
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={4}
              required={contentType !== 'routine'}
              disabled={isLoading}
            />
          </div>
        )}

        {/* File Upload */}
        {contentType !== 'routine' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Attachments
            </label>
            <FileUpload
              multiple={true}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
              maxSize={10}
              onFileSelect={handleFileSelect}
            />

            {/* Selected Files List */}
            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Selected Files:</h4>
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-600">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className={`px-4 py-2 rounded-md text-white ${
              isLoading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Content'}
          </button>
        </div>
      </form>
    </div>
  );
}