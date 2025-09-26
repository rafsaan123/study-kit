'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import GPSAreaCalculator from './components/GPSAreaCalculator';

interface ReferredSubject {
  subject_semester: number;
  subject_code: number;
  subject_name: string;
  reffered_type: string;
  passed: boolean;
}

interface ExamResult {
  date: string;
  instituteCode: number;
  gpa?: number;
  reffereds: ReferredSubject[];
}

interface SemesterResult {
  semester: number;
  exam_results: ExamResult[];
}

interface Institute {
  code: number;
  name: string;
  district: string;
}

interface ResultData {
  exam: string;
  roll: number;
  regulation: number;
  otherRegulations: string[];
  institute: Institute;
  current_reffereds: ReferredSubject[];
  semester_results: SemesterResult[];
  latest_result: ExamResult;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Result search states
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [regulation, setRegulation] = useState<string>('2022');
  const [program, setProgram] = useState<string>('Diploma in Engineering');
  const [activeTab, setActiveTab] = useState<'results' | 'calculator'>('results');

  const fetchResult = async () => {
    if (!studentId) {
      setError('Please enter a roll number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        studentId,
        regulation,
        program
      });

      const response = await fetch(`/api/result?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch result');
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch result. Please try again later.');
      console.error('Error fetching result:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderReferreds = (reffereds: ReferredSubject[]) => {
    if (!reffereds || reffereds.length === 0) return null;

    return (
      <div className="mt-2 bg-red-50 p-3 rounded-lg">
        <h6 className="text-xs font-semibold text-red-700 mb-1">Referred Subjects:</h6>
        <div className="space-y-1">
          {reffereds.map((subject, index) => (
            <div key={index} className="flex justify-between items-center text-xs">
              <span className="text-red-600">{subject.subject_name}</span>
              <span className="text-red-500 text-xs">
                Code: {subject.subject_code}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Student Kit</h1>
            </div>
            <div className="flex items-center space-x-4">
              {status === 'loading' ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              ) : session ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">Welcome, {session.user?.name}</span>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => signOut()}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit mx-auto">
            <button
              onClick={() => setActiveTab('results')}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === 'results'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              BTEB Result Search
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === 'calculator'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Area Calculator
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'results' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Result Search Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">BTEB Result Search</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter Roll Number"
                  className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={regulation}
                  onChange={(e) => setRegulation(e.target.value)}
                  className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2010">2010</option>
                  <option value="2016">2016</option>
                  <option value="2022">2022</option>
                </select>
                <select
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Diploma in Engineering">Diploma in Engineering</option>
                  <option value="Diploma in Technology">Diploma in Technology</option>
                  <option value="Diploma in Agriculture">Diploma in Agriculture</option>
                </select>
              </div>

              <button
                onClick={fetchResult}
                disabled={loading}
                className={`w-full px-4 py-2 rounded-md text-white ${
                  loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {loading ? 'Searching...' : 'Search Result'}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}

            {result && (
              <div className="mt-6 space-y-4">
                {/* Institute Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Institute Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-600">Institute Name</p>
                      <p className="font-medium text-sm">{result.institute.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">District</p>
                      <p className="font-medium text-sm">{result.institute.district}</p>
                    </div>
                  </div>
                </div>

                {/* Semester Results */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Semester Results</h3>
                  <div className="space-y-2">
                    {result.semester_results
                      .sort((a, b) => b.semester - a.semester)
                      .map((semester) => (
                        <div key={semester.semester} className="bg-white p-3 rounded border">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">
                            Semester {semester.semester}
                          </h4>
                          {semester.exam_results.map((exam, index) => (
                            <div key={index}>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-xs text-gray-600">GPA</p>
                                  <p className="font-bold text-gray-800">
                                    {exam.gpa || 'Referred'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Exam Date</p>
                                  <p className="font-medium text-xs">{formatDate(exam.date)}</p>
                                </div>
                              </div>
                              {exam.reffereds.length > 0 && renderReferreds(exam.reffereds)}
                            </div>
                          ))}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Additional Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-600">Roll Number</p>
                      <p className="font-medium">{result.roll}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Regulation</p>
                      <p className="font-medium">{result.regulation}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Exam</p>
                      <p className="font-medium">{result.exam}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Data Source</p>
                      <p className="font-medium text-green-600">Pookie Backend API</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Features Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Features</h2>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Instant Result Search</h3>
                  <p className="text-gray-600">Search BTEB results instantly with roll number, regulation, and program selection.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Multiple Data Sources</h3>
                  <p className="text-gray-600">Access results from multiple Supabase databases with web API fallback for maximum coverage.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Secure Access</h3>
                  <p className="text-gray-600">Login to access additional features like student management and content upload.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Comprehensive Results</h3>
                  <p className="text-gray-600">View detailed semester results, GPA information, and referred subjects.</p>
                </div>
              </div>
            </div>

            {!session && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Get Started</h3>
                <p className="text-gray-600 mb-4">
                  Login to access additional features like student management, content upload, and personalized dashboard.
                </p>
                <button
                  onClick={() => signIn()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Login to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
        ) : (
          <div className="max-w-4xl mx-auto">
                   <GPSAreaCalculator />
      </div>
        )}
    </main>
    </div>
  );
}
