'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NavBar from '../components/NavBar';
import ViewRoutineTable from '../components/ViewRoutineTable';
import Results from '../components/Results';

interface Attachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
}

interface RoutineClass {
  subject: string;
  teacher: string;
}

interface RoutineData {
  time: string;
  sunday: RoutineClass | null;
  monday: RoutineClass | null;
  tuesday: RoutineClass | null;
  wednesday: RoutineClass | null;
  thursday: RoutineClass | null;
  friday: RoutineClass | null;
  saturday: RoutineClass | null;
}

interface ContentItem {
  _id: string;
  title: string;
  content: string;
  contentType: string;
  targetSession: string;
  targetDepartment: string;
  routineData?: RoutineData[];
  attachments: Attachment[];
  createdAt: string;
}

interface DownloadState {
  [key: string]: {
    isLoading: boolean;
    error: string | null;
  };
}

export default function StudentDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [activeType, setActiveType] = useState('notice');
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
  const [downloadStates, setDownloadStates] = useState<DownloadState>({});

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push('/auth/login');
      return;
    }


    const fetchContent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/content?type=${activeType}`);
        if (!response.ok) throw new Error('Failed to fetch content');
        const data = await response.json();
        console.log('Fetched content:', data); // Debug log
        setContents(data);
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [activeType, session, router]);

  useEffect(() => {
    if (!session || session.user.userType !== 'student') {
      router.push('/auth/login');
    }
  }, [session, router]);

  if (!session || session.user.userType !== 'student') {
    return null;
  }

  const contentTypes = [
    { id: 'notice', label: 'Notices', icon: '📢' },
    { id: 'assignment', label: 'Assignments', icon: '📝' },
    { id: 'routine', label: 'Class Routine', icon: '📅' },
    { id: 'material', label: 'Study Materials', icon: '📚' },
    { id: 'results', label: 'Results', icon: '📊' },
  ];

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleDownload = async (attachment: Attachment, itemId: string) => {
    const downloadKey = `${itemId}-${attachment.fileName}`;

    setDownloadStates(prev => ({
      ...prev,
      [downloadKey]: { isLoading: true, error: null }
    }));

    try {
      // Check if it's a GCS URL
      if (attachment.fileUrl.includes('storage.googleapis.com')) {
        // For GCS files, use the download API to get a signed URL
        const downloadUrl = `/api/download?fileUrl=${encodeURIComponent(attachment.fileUrl)}&originalName=${encodeURIComponent(attachment.fileName)}`;
        
        // Open in new tab for GCS files
        window.open(downloadUrl, '_blank');
        
        setDownloadStates(prev => ({
          ...prev,
          [downloadKey]: { isLoading: false, error: null }
        }));
      } else {
        // Legacy local file download
        const response = await fetch(attachment.fileUrl);
        if (!response.ok) throw new Error('Download failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', attachment.fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        setDownloadStates(prev => ({
          ...prev,
          [downloadKey]: { isLoading: false, error: null }
        }));
      }
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStates(prev => ({
        ...prev,
        [downloadKey]: { 
          isLoading: false, 
          error: 'Failed to download file. Please try again.' 
        }
      }));

      setTimeout(() => {
        setDownloadStates(prev => {
          const newState = { ...prev };
          delete newState[downloadKey];
          return newState;
        });
      }, 3000);
    }
  };

  // Get the latest routine if the active type is routine
  const latestRoutine = activeType === 'routine' && contents.length > 0 
    ? contents.find(content => content.contentType === 'routine')
    : null;

  console.log('Latest Routine:', latestRoutine); // Debug log

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Content Type Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              {contentTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setActiveType(type.id)}
                  className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    activeType === type.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Display */}
        <div className="space-y-6">
          {activeType === 'results' ? (
            <Results />
          ) : loading ? (
            <div className="text-center py-12">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
              <p className="mt-2 text-gray-500">Loading content...</p>
            </div>
          ) : contents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-900">No Content Available</h3>
              <p className="mt-1 text-gray-500">No {activeType} available at the moment.</p>
            </div>
          ) : activeType === 'routine' && latestRoutine ? (
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              {Array.isArray(latestRoutine.routineData) && latestRoutine.routineData.length > 0 ? (
                <ViewRoutineTable routineData={latestRoutine.routineData} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No routine data available
                </div>
              )}
            </div>
          ) : (
            contents.map(item => (
              <div key={item._id} className="bg-white shadow-lg rounded-lg overflow-hidden">
                {/* Header with expand/collapse */}
                <div
                  onClick={() => toggleExpand(item._id)}
                  className="border-b border-gray-200 bg-gray-50 px-6 py-4 cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-800">{item.title}</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Posted on {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 transform transition-transform ${
                        expandedItems[item._id] ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Expandable content */}
                {expandedItems[item._id] && (
                  <div className="px-6 py-4">
                    {item.content && (
                      <p className="text-gray-700 whitespace-pre-wrap">{item.content}</p>
                    )}

                    {/* Attachments section */}
                    {item.attachments?.length > 0 && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Attachments</h3>
                        <div className="space-y-2">
                          {item.attachments.map((attachment, index) => {
                            const downloadKey = `${item._id}-${attachment.fileName}`;
                            const downloadState = downloadStates[downloadKey] || { isLoading: false, error: null };

                            return (
                              <div key={index} className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <svg
                                    className="w-5 h-5 text-gray-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">
                                      {attachment.fileName}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {attachment.fileType || 'Unknown type'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleDownload(attachment, item._id)}
                                    disabled={downloadState.isLoading}
                                    className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md 
                                      ${downloadState.isLoading 
                                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                        : downloadState.error
                                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                          : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                                      } transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                  >
                                    {downloadState.isLoading ? (
                                      <>
                                        <svg
                                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                        >
                                          <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                          />
                                          <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                          />
                                        </svg>
                                        Downloading...
                                      </>
                                    ) : (
                                      <>
                                        <svg
                                          className="mr-2 h-4 w-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                          />
                                        </svg>
                                        {downloadState.error ? 'Try Again' : 'Download'}
                                      </>
                                    )}
                                  </button>
                                  {downloadState.error && (
                                    <span className="text-xs text-red-600">
                                      {downloadState.error}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}