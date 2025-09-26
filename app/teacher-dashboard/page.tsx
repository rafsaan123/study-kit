'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import CreateContentForm from '../components/CreateContentForm';
import CreateStudentForm from '../components/CreateStudentForm';
import CreateRoutineForm from '../components/CreateRoutineForm';
import NavBar from '../components/NavBar';
import ManageContent from '../components/ManageContent';


export default function TeacherDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('content');

  if (!session || session.user.userType !== 'teacher') {
    router.push('/auth/login');
    return null;
  }

  return React.createElement('div', { className: 'min-h-screen bg-gray-50' }, [
    React.createElement(NavBar, { key: 'navbar' }),

    React.createElement('main', {
      key: 'main',
      className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'
    }, [
      // Tabs
      React.createElement('div', {
        key: 'tabs',
        className: 'bg-white rounded-lg shadow mb-6'
      },
        React.createElement('div', { className: 'border-b border-gray-200' },
          React.createElement('nav', {
            className: '-mb-px flex',
            'aria-label': 'Tabs'
          }, [
            React.createElement('button', {
              key: 'create-content',
              onClick: () => setActiveTab('content'),
              className: `w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'content'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }, [
              React.createElement('span', { key: 'icon', className: 'mr-2' }, '📝'),
              'Create Content'
            ]),
            React.createElement('button', {
              key: 'create-routine',
              onClick: () => setActiveTab('routine'),
              className: `w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'routine'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }, [
              React.createElement('span', { key: 'icon', className: 'mr-2' }, '📅'),
              'Create Routine'
            ]),
            React.createElement('button', {
              key: 'manage-content',
              onClick: () => setActiveTab('manage'),
              className: `w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'manage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }, [
              React.createElement('span', { key: 'icon', className: 'mr-2' }, '📋'),
              'Manage Content'
            ]),
            React.createElement('button', {
              key: 'students',
              onClick: () => setActiveTab('students'),
              className: `w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'students'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }, [
              React.createElement('span', { key: 'icon', className: 'mr-2' }, '👥'),
              'Manage Students'
            ])
          ])
        )
      ),

      // Tab Content
      React.createElement('div', {
        key: 'tab-content',
        className: 'bg-white rounded-lg shadow p-6'
      }, 
        activeTab === 'content' ? React.createElement(CreateContentForm) :
        activeTab === 'routine' ? React.createElement(CreateRoutineForm) :
        activeTab === 'manage' ? React.createElement(ManageContent) :
        React.createElement(CreateStudentForm)
      )
    ])
  ]);
}