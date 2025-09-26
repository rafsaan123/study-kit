'use client';

import React, { useState, useEffect } from 'react';

interface Content {
  _id: string;
  title: string;
  contentType: string;
  targetSession: string;
  content?: string;
  routineData?: any[];
  createdAt: string;
}

export default function ManageContent() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    targetSession: ''
  });

  useEffect(() => {
    fetchContents();
  }, [activeType]);

  const fetchContents = async () => {
    try {
      const query = activeType !== 'all' ? `?type=${activeType}` : '';
      const response = await fetch(`/api/content${query}`);
      if (response.ok) {
        const data = await response.json();
        setContents(data);
      }
    } catch (error) {
      console.error('Error fetching contents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const response = await fetch(`/api/content/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setContents(contents.filter(content => content._id !== id));
      }
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  const handleEdit = async (id: string) => {
    const content = contents.find(c => c._id === id);
    if (content) {
      setEditForm({
        title: content.title,
        content: content.content || '',
        targetSession: content.targetSession
      });
      setEditingId(id);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const response = await fetch(`/api/content/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updatedContent = await response.json();
        setContents(contents.map(c => 
          c._id === id ? updatedContent : c
        ));
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error updating content:', error);
    }
  };

  return React.createElement('div', { className: 'space-y-6' }, [
    // Filter buttons
    React.createElement('div', { 
      key: 'filters',
      className: 'flex space-x-4 mb-4' 
    }, [
      ['all', 'notice', 'assignment', 'routine', 'material'].map(type =>
        React.createElement('button', {
          key: type,
          onClick: () => setActiveType(type),
          className: `px-4 py-2 rounded ${
            activeType === type
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`
        }, type.charAt(0).toUpperCase() + type.slice(1))
      )
    ]),

    // Content list
    loading ? 
      React.createElement('div', { className: 'text-center py-4' }, 'Loading...') :
      contents.map(content =>
        React.createElement('div', {
          key: content._id,
          className: 'bg-white shadow rounded-lg p-6'
        }, [
          editingId === content._id ?
            // Edit form
            React.createElement('div', { key: 'edit-form', className: 'space-y-4' }, [
              React.createElement('input', {
                value: editForm.title,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, title: e.target.value }),
                className: 'w-full p-2 border rounded'
              }),
              content.contentType !== 'routine' && React.createElement('textarea', {
                value: editForm.content,
                onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setEditForm({ ...editForm, content: e.target.value }),
                className: 'w-full p-2 border rounded'
              }),
              React.createElement('div', { className: 'flex space-x-2' }, [
                React.createElement('button', {
                  onClick: () => handleUpdate(content._id),
                  className: 'px-4 py-2 bg-green-500 text-white rounded'
                }, 'Save'),
                React.createElement('button', {
                  onClick: () => setEditingId(null),
                  className: 'px-4 py-2 bg-gray-500 text-white rounded'
                }, 'Cancel')
              ])
            ]) :
            // Content display
            React.createElement('div', null, [
              React.createElement('div', { 
                key: 'header',
                className: 'flex justify-between items-start mb-4' 
              }, [
                React.createElement('div', null, [
                  React.createElement('h3', { className: 'text-lg font-semibold' }, content.title),
                  React.createElement('p', { className: 'text-sm text-gray-500' }, `Type: ${content.contentType}`)
                ]),
                React.createElement('div', { className: 'flex space-x-2' }, [
                  React.createElement('button', {
                    onClick: () => handleEdit(content._id),
                    className: 'px-3 py-1 bg-blue-500 text-white rounded'
                  }, 'Edit'),
                  React.createElement('button', {
                    onClick: () => handleDelete(content._id),
                    className: 'px-3 py-1 bg-red-500 text-white rounded'
                  }, 'Delete')
                ])
              ]),
              React.createElement('p', { className: 'text-gray-600' }, 
                content.contentType === 'routine' ? 'Class Routine' : content.content
              ),
              React.createElement('p', { 
                key: 'meta',
                className: 'text-sm text-gray-500 mt-2' 
              }, [
                `Session: ${content.targetSession}`,
                React.createElement('span', { className: 'mx-2' }, '•'),
                `Created: ${new Date(content.createdAt).toLocaleDateString()}`
              ])
            ])
        ])
      )
  ]);
}