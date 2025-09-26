'use client';

import React, { useState } from 'react';

interface RoutineClass {
  time: string;
  sunday: { subject: string; teacher: string } | null;
  monday: { subject: string; teacher: string } | null;
  tuesday: { subject: string; teacher: string } | null;
  wednesday: { subject: string; teacher: string } | null;
  thursday: { subject: string; teacher: string } | null;
  friday: { subject: string; teacher: string } | null;
  saturday: { subject: string; teacher: string } | null;
}

interface Props {
  isEditing: boolean;
  initialData: RoutineClass[];
  onDataChange?: (data: RoutineClass[]) => void;
}

const createEmptyTimeSlot = () => ({
  time: "",
  sunday: null,
  monday: null,
  tuesday: null,
  wednesday: null,
  thursday: null,
  friday: null,
  saturday: null
});

export default function RoutineTable({ isEditing = false, initialData = [], onDataChange }: Props) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  const [routineData, setRoutineData] = useState<RoutineClass[]>(
    initialData.length > 0 ? initialData : [createEmptyTimeSlot()]
  );

  const handleClassChange = (rowIndex: number, day: string, field: 'subject' | 'teacher', value: string) => {
    const newData = [...routineData];
    const currentValue = (newData[rowIndex] as any)[day] || { subject: '', teacher: '' };
    (newData[rowIndex] as any)[day] = {
      ...currentValue,
      [field]: value
    };
    setRoutineData(newData);
    onDataChange?.(newData);
  };

  const handleTimeChange = (rowIndex: number, type: 'start' | 'end', value: string) => {
    const newData = [...routineData];
    const currentTimeParts = newData[rowIndex].time.split(' - ');

    if (type === 'start') {
      newData[rowIndex].time = `${value} - ${currentTimeParts[1] || ''}`;
    } else {
      newData[rowIndex].time = `${currentTimeParts[0] || ''} - ${value}`;
    }

    setRoutineData(newData);
    onDataChange?.(newData);
  };

  const addTimeSlot = () => {
    setRoutineData([...routineData, createEmptyTimeSlot()]);
    onDataChange?.([...routineData, createEmptyTimeSlot()]);
  };

  const removeTimeSlot = (index: number) => {
    if (routineData.length > 1) {
      const newData = routineData.filter((_, i) => i !== index);
      setRoutineData(newData);
      onDataChange?.(newData);
    }
  };

  return React.createElement('div', { 
    className: 'space-y-4'
  }, [
    // Add Time Slot Button
    isEditing && React.createElement('button', {
      key: 'add-slot',
      onClick: addTimeSlot,
      className: 'mb-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors'
    }, '+ Add Time Slot'),

    // Table Container
    React.createElement('div', { 
      className: 'overflow-x-auto'
    },
      React.createElement('table', { 
        className: 'min-w-full table-fixed border border-gray-200'
      }, [
        // Table Header
        React.createElement('thead', null,
          React.createElement('tr', { className: 'bg-gray-50 border-b border-gray-200' }, [
            React.createElement('th', { 
              key: 'time',
              className: 'w-32 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
            }, 'Time'),
            ...days.map(day => 
              React.createElement('th', { 
                key: day,
                className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              }, day.charAt(0).toUpperCase() + day.slice(1))
            ),
            isEditing && React.createElement('th', {
              key: 'actions',
              className: 'w-20 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
            }, 'Actions')
          ])
        ),
        // Table Body
        React.createElement('tbody', null,
          routineData.map((row, rowIndex) => 
            React.createElement('tr', { 
              key: rowIndex,
              className: `${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`
            }, [
              // Time Input
              React.createElement('td', { 
                className: 'px-6 py-4 text-sm font-medium text-gray-900 border-b border-gray-200'
              }, 
                isEditing ? 
                  React.createElement('div', { className: 'flex space-x-2' }, [
                    React.createElement('input', {
                      key: 'start-time',
                      type: 'time',
                      value: row.time.split(' - ')[0] || '',
                      onChange: (e) => handleTimeChange(rowIndex, 'start', e.target.value),
                      className: 'w-24 p-1 text-sm border border-gray-300 rounded'
                    }),
                    React.createElement('span', { className: 'text-gray-500' }, '-'),
                    React.createElement('input', {
                      key: 'end-time',
                      type: 'time',
                      value: row.time.split(' - ')[1] || '',
                      onChange: (e) => handleTimeChange(rowIndex, 'end', e.target.value),
                      className: 'w-24 p-1 text-sm border border-gray-300 rounded'
                    })
                  ])
                : row.time
              ),
              // Day Cells
              ...days.map(day => 
                React.createElement('td', { 
                  key: day,
                  className: 'px-6 py-4 border-b border-gray-200'
                },
                  isEditing ? 
                    React.createElement('div', { className: 'space-y-2' }, [
                      React.createElement('input', {
                        key: 'subject',
                        type: 'text',
                        placeholder: 'Subject',
                        value: (row as any)[day]?.subject || '',
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleClassChange(rowIndex, day, 'subject', e.target.value),
                        className: 'w-full p-1 text-sm border border-gray-300 rounded'
                      }),
                      React.createElement('input', {
                        key: 'teacher',
                        type: 'text',
                        placeholder: 'Teacher',
                        value: (row as any)[day]?.teacher || '',
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleClassChange(rowIndex, day, 'teacher', e.target.value),
                        className: 'w-full p-1 text-sm border border-gray-300 rounded'
                      })
                    ]) :
                    (row as any)[day] && React.createElement('div', { className: 'space-y-1' }, [
                      React.createElement('div', {
                        key: 'subject',
                        className: 'text-sm font-medium text-gray-900'
                      }, (row as any)[day].subject),
                      React.createElement('div', {
                        key: 'teacher',
                        className: 'text-sm text-gray-500'
                      }, (row as any)[day].teacher)
                    ])
                )
              ),
              // Remove Button
              isEditing && React.createElement('td', {
                className: 'px-6 py-4 border-b border-gray-200'
              },
                routineData.length > 1 && React.createElement('button', {
                  onClick: () => removeTimeSlot(rowIndex),
                  className: 'text-red-600 hover:text-red-800'
                }, '🗑️')
              )
            ])
          )
        )
      ])
    )
  ]);
}