'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

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

export default function CreateRoutineForm() {
  const { data: session } = useSession();
  const [title, setTitle] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [routineData, setRoutineData] = useState<RoutineClass[]>([]);
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');
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

  // Generate hours (8 AM to 5 PM)
  const hours = Array.from({ length: 10 }, (_, i) => i + 8);
  
  // Generate minutes in 5-minute intervals
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const createEmptyTimeSlot = (time: string) => ({
    time,
    sunday: null,
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: null,
    saturday: null
  });

  const handleTimeSlotChange = (hour: number, minute: number) => {
    const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const endMinute = minute + 5;
    const endHour = endMinute >= 60 ? hour + 1 : hour;
    const endMinuteFormatted = endMinute >= 60 ? endMinute - 60 : endMinute;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinuteFormatted.toString().padStart(2, '0')}`;
    const timeSlot = `${startTime} - ${endTime}`;
    
    const existingSlot = routineData.find(slot => slot.time === timeSlot);
    if (existingSlot) {
      // Remove existing slot
      setRoutineData(routineData.filter(slot => slot.time !== timeSlot));
    } else {
      // Add new slot
      setRoutineData([...routineData, createEmptyTimeSlot(timeSlot)]);
    }
  };

  const handleClassChange = (timeSlot: string, day: string, field: 'subject' | 'teacher', value: string) => {
    const newData = routineData.map(slot => {
      if (slot.time === timeSlot) {
        const currentValue = (slot as any)[day] || { subject: '', teacher: '' };
        return {
          ...slot,
          [day]: {
            ...currentValue,
            [field]: value
          }
        };
      }
      return slot;
    });
    setRoutineData(newData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (!title.trim()) {
        throw new Error('Title is required');
      }

      if (!selectedSession) {
        throw new Error('Session is required');
      }

      if (routineData.length === 0) {
        throw new Error('Please add at least one time slot');
      }

      // Create the content with routine data
      const contentFormData = new FormData();
      contentFormData.append('title', title);
      contentFormData.append('contentType', 'routine');
      contentFormData.append('targetSession', selectedSession);
      contentFormData.append('targetDepartment', selectedDepartment);
      contentFormData.append('routineData', JSON.stringify(routineData));

      const contentResponse = await fetch('/api/content', {
        method: 'POST',
        body: contentFormData
      });

      if (!contentResponse.ok) {
        const errorData = await contentResponse.json();
        throw new Error(errorData.error || 'Failed to create routine');
      }

      // Clear form
      setTitle('');
      setSelectedSession('');
      setSelectedDepartment('All');
      setSelectedHour('');
      setSelectedMinute('');
      setRoutineData([]);
      setMessage({ type: 'success', text: 'Routine created successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to create routine' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  return React.createElement('div', { className: 'space-y-6' }, [
    // Message Display
    message.text && React.createElement('div', {
      key: 'message',
      className: `p-4 rounded-md ${
        message.type === 'success' 
          ? 'bg-green-50 text-green-800 border border-green-200' 
          : 'bg-red-50 text-red-800 border border-red-200'
      }`
    }, message.text),

    // Form
    React.createElement('form', {
      key: 'form',
      onSubmit: handleSubmit,
      className: 'space-y-6'
    }, [
      // Title Input
      React.createElement('div', {
        key: 'title'
      }, [
        React.createElement('label', {
          key: 'label',
          className: 'block text-sm font-medium text-gray-700'
        }, 'Routine Title'),
        React.createElement('input', {
          key: 'input',
          type: 'text',
          value: title,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value),
          className: 'mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
          required: true,
          disabled: isLoading,
          placeholder: 'Enter routine title (e.g., "Class Routine 2024-25")'
        })
      ]),

      // Session Select
      React.createElement('div', {
        key: 'session'
      }, [
        React.createElement('label', {
          key: 'label',
          className: 'block text-sm font-medium text-gray-700'
        }, 'Session'),
        React.createElement('select', {
          key: 'select',
          value: selectedSession,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedSession(e.target.value),
          className: 'mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
          required: true,
          disabled: isLoading
        }, [
          React.createElement('option', { key: 'empty', value: '' }, 'Select a session'),
          ...sessions.map(session => 
            React.createElement('option', { key: session, value: session }, session)
          )
        ])
      ]),

      // Department Select
      React.createElement('div', {
        key: 'department'
      }, [
        React.createElement('label', {
          key: 'label',
          className: 'block text-sm font-medium text-gray-700'
        }, 'Department'),
        React.createElement('select', {
          key: 'select',
          value: selectedDepartment,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedDepartment(e.target.value),
          className: 'mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
          required: true,
          disabled: isLoading
        }, [
          ...departments.map(dept => 
            React.createElement('option', { key: dept, value: dept }, dept)
          )
        ])
      ]),

      // Time Slot Selection
      React.createElement('div', {
        key: 'time-slots'
      }, [
        React.createElement('label', {
          key: 'label',
          className: 'block text-sm font-medium text-gray-700 mb-2'
        }, 'Add Time Slots'),
        React.createElement('div', {
          key: 'time-selectors',
          className: 'flex space-x-4 items-end mb-4'
        }, [
          // Hour Selector
          React.createElement('div', {
            key: 'hour-selector'
          }, [
            React.createElement('label', {
              key: 'hour-label',
              className: 'block text-sm font-medium text-gray-700 mb-1'
            }, 'Hour'),
            React.createElement('select', {
              key: 'hour-select',
              value: selectedHour,
              onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedHour(e.target.value),
              className: 'block w-20 rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
            }, [
              React.createElement('option', { key: 'empty', value: '' }, '--'),
              ...hours.map(hour => 
                React.createElement('option', { key: hour, value: hour }, hour.toString().padStart(2, '0'))
              )
            ])
          ]),
          // Minute Selector
          React.createElement('div', {
            key: 'minute-selector'
          }, [
            React.createElement('label', {
              key: 'minute-label',
              className: 'block text-sm font-medium text-gray-700 mb-1'
            }, 'Minute'),
            React.createElement('select', {
              key: 'minute-select',
              value: selectedMinute,
              onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedMinute(e.target.value),
              className: 'block w-20 rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
            }, [
              React.createElement('option', { key: 'empty', value: '' }, '--'),
              ...minutes.map(minute => 
                React.createElement('option', { key: minute, value: minute }, minute.toString().padStart(2, '0'))
              )
            ])
          ]),
          // Add Button
          React.createElement('button', {
            key: 'add-button',
            type: 'button',
            onClick: () => {
              const hour = parseInt(selectedHour);
              const minute = parseInt(selectedMinute);
              
              if (!isNaN(hour) && !isNaN(minute)) {
                handleTimeSlotChange(hour, minute);
                setSelectedHour('');
                setSelectedMinute('');
              }
            },
            disabled: !selectedHour || !selectedMinute,
            className: `px-4 py-2 rounded-md transition-colors ${
              selectedHour && selectedMinute
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`
          }, 'Add Slot')
        ]),
        // Selected Time Slots Display
        routineData.length > 0 && React.createElement('div', {
          key: 'selected-slots'
        }, [
          React.createElement('label', {
            key: 'selected-label',
            className: 'block text-sm font-medium text-gray-700 mb-2'
          }, 'Selected Time Slots'),
          React.createElement('div', {
            key: 'selected-grid',
            className: 'flex flex-wrap gap-2'
          }, 
            routineData.map((slot, index) => 
              React.createElement('div', {
                key: index,
                className: 'flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-md'
              }, [
                React.createElement('span', { key: 'time' }, slot.time),
                React.createElement('button', {
                  key: 'remove',
                  type: 'button',
                  onClick: () => {
                    setRoutineData(routineData.filter((_, i) => i !== index));
                  },
                  className: 'text-blue-600 hover:text-blue-800 ml-1'
                }, '×')
              ])
            )
          )
        ])
      ]),

      // Routine Table
      routineData.length > 0 && React.createElement('div', {
        key: 'routine-table'
      }, [
        React.createElement('label', {
          key: 'label',
          className: 'block text-sm font-medium text-gray-700 mb-2'
        }, 'Class Schedule'),
        React.createElement('div', {
          key: 'table-container',
          className: 'overflow-x-auto border border-gray-200 rounded-md'
        },
          React.createElement('table', {
            className: 'min-w-full table-fixed'
          }, [
            // Table Header
            React.createElement('thead', {
              key: 'thead'
            },
              React.createElement('tr', {
                className: 'bg-gray-50 border-b border-gray-200'
              }, [
                React.createElement('th', {
                  key: 'time',
                  className: 'w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                }, 'Time'),
                ...days.map(day => 
                  React.createElement('th', {
                    key: day,
                    className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  }, day.charAt(0).toUpperCase() + day.slice(1))
                )
              ])
            ),
            // Table Body
            React.createElement('tbody', {
              key: 'tbody'
            },
              routineData.map((slot, index) => 
                React.createElement('tr', {
                  key: index,
                  className: `${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`
                }, [
                  // Time
                  React.createElement('td', {
                    key: 'time',
                    className: 'px-4 py-3 text-sm font-medium text-gray-900 border-b border-gray-200'
                  }, slot.time),
                  // Day Cells
                  ...days.map(day => 
                    React.createElement('td', {
                      key: day,
                      className: 'px-4 py-3 border-b border-gray-200'
                    },
                      React.createElement('div', {
                        className: 'space-y-2'
                      }, [
                        React.createElement('input', {
                          key: 'subject',
                          type: 'text',
                          placeholder: 'Subject',
                          value: (slot as any)[day]?.subject || '',
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleClassChange(slot.time, day, 'subject', e.target.value),
                          className: 'w-full p-1 text-sm border border-gray-300 rounded'
                        }),
                        React.createElement('input', {
                          key: 'teacher',
                          type: 'text',
                          placeholder: 'Teacher',
                          value: (slot as any)[day]?.teacher || '',
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleClassChange(slot.time, day, 'teacher', e.target.value),
                          className: 'w-full p-1 text-sm border border-gray-300 rounded'
                        })
                      ])
                    )
                  )
                ])
              )
            )
          ])
        )
      ]),

      // Submit Button
      React.createElement('div', {
        key: 'submit',
        className: 'flex justify-end'
      },
        React.createElement('button', {
          type: 'submit',
          className: `px-6 py-2 rounded-md text-white ${
            isLoading 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`,
          disabled: isLoading
        }, isLoading ? 'Creating...' : 'Create Routine')
      )
    ])
  ]);
}
