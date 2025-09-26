'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function CreateStudentForm() {
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [session_year, setSession_year] = useState('');
  const [regulation, setRegulation] = useState('2022');
  const [department, setDepartment] = useState('Survey Technology');
  const departments = [
    'Survey Technology',
    'Cadastral Topography And Land Information Technology',
    'Geoinformatics Technology'
  ];
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const currentYear = new Date().getFullYear();
  const sessions = [
    `${currentYear}-${(currentYear + 1).toString().slice(-2)}`,
    `${currentYear-1}-${currentYear.toString().slice(-2)}`,
    `${currentYear-2}-${(currentYear-1).toString().slice(-2)}`,
    `${currentYear-3}-${(currentYear-2).toString().slice(-2)}`
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          studentId,
          password,
          session: session_year,
          regulation: parseInt(regulation),
          department
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to create student');
      }

      // Clear form
      setName('');
      setStudentId('');
      setPassword('');
      setSession_year('');
      setRegulation('2022');
      setMessage({ type: 'success', text: 'Student created successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to create student' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!session || session.user.userType !== 'teacher') {
    return (
      <div className="text-center p-4 bg-yellow-100 rounded">
        You must be logged in as a teacher to access this feature.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Create New Student Account</h2>

      {message.text && (
        <div className={`mb-4 p-3 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
            disabled={isLoading}
          />
        </div>

        {/* Student ID Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Student ID
          </label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
            disabled={isLoading}
            pattern="\d{6}"
            title="Student ID should be 6 digits"
          />
          <p className="mt-1 text-sm text-gray-500">
            Must be 6 digits
          </p>
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
            disabled={isLoading}
            minLength={6}
          />
          <p className="mt-1 text-sm text-gray-500">
            Minimum 6 characters
          </p>
        </div>

        {/* Session Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Session
          </label>
          <select
            value={session_year}
            onChange={(e) => setSession_year(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
            disabled={isLoading}
          >
            <option value="">Select a session</option>
            {sessions.map(session => (
              <option key={session} value={session}>
                {session} Session
              </option>
            ))}
          </select>
        </div>

        {/* Regulation Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Regulation
          </label>
          <select
            value={regulation}
            onChange={(e) => setRegulation(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
            disabled={isLoading}
          >
            <option value="2022">2022 Regulation</option>
            <option value="2016">2016 Regulation</option>
            <option value="2010">2010 Regulation</option>
          </select>
        </div>

        {/* Department Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Department
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
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
            {isLoading ? 'Creating...' : 'Create Student'}
          </button>
        </div>
      </form>
    </div>
  );
}