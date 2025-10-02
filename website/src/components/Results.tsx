'use client';

import { useState } from 'react';

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

export default function Results() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [regulation, setRegulation] = useState<string>('2022');
  const [program, setProgram] = useState<string>('Diploma in Engineering');

  const fetchResult = async () => {
    if (!studentId) {
      setError('Please enter a student ID');
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
    } catch (error: unknown) {
      setError((error instanceof Error ? error.message : 'Failed to fetch result. Please try again later.'));
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
      <div className="mt-4 bg-red-50 p-4 rounded-lg">
        <h5 className="text-sm font-semibold text-red-700 mb-2">Referred Subjects:</h5>
        <div className="space-y-2">
          {reffereds.map((subject, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="text-red-600">{subject.subject_name}</span>
              <span className="text-red-500 text-xs">
                Code: {subject.subject_code} | Type: {subject.reffered_type}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">BTEB Result Search</h2>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-2">
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
              className={`px-4 py-2 rounded-md text-white ${
                loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {loading ? 'Searching...' : result ? 'Refresh Result' : 'Search Result'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* Institute Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Institute Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Institute Name</p>
                  <p className="font-medium">{result.institute.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">District</p>
                  <p className="font-medium">{result.institute.district}</p>
                </div>
              </div>
            </div>

            {/* Current Referred Subjects */}
            {result.current_reffereds.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-red-700 mb-4">Current Referred Subjects</h3>
                {renderReferreds(result.current_reffereds)}
              </div>
            )}

            {/* Semester Results */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Semester Results</h3>
              <div className="space-y-4">
                {result.semester_results
                  .sort((a, b) => b.semester - a.semester)
                  .map((semester) => (
                    <div key={semester.semester} className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold text-gray-700 mb-3">
                        Semester {semester.semester}
                      </h4>
                      {semester.exam_results.map((exam, index) => (
                        <div key={index}>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">GPA</p>
                              <p className="font-bold text-gray-800">
                                {exam.gpa || 'Referred'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Exam Date</p>
                              <p className="font-medium">{formatDate(exam.date)}</p>
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
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Additional Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Roll Number</p>
                  <p className="font-medium">{result.roll}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Regulation</p>
                  <p className="font-medium">{result.regulation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Exam</p>
                  <p className="font-medium">{result.exam}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Data Source</p>
                  <p className="font-medium text-green-600">Pookie Backend API</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
