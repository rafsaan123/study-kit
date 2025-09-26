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
  routineData?: RoutineClass[] | null | undefined;
}

const convertTo12Hour = (time: string) => {
  if (!time) return '';

  const [start, end] = time.split(' - ');
  if (!start || !end) return time;

  const format12Hour = (time: string) => {
    const [hours, minutes] = time.split(':');
    if (!hours || !minutes) return time;

    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return `${format12Hour(start)} - ${format12Hour(end)}`;
};

const getTimeInMinutes = (timeString: string) => {
  if (!timeString) return 0;

  const time = timeString.split(' - ')[0];
  if (!time) return 0;

  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 0;

  return hours * 60 + minutes;
};

export default function ViewRoutineTable({ routineData }: Props) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[new Date().getDay()].toLowerCase();
  const [selectedDay, setSelectedDay] = useState(currentDay);

  // Check if routineData exists and is an array
  const validRoutineData = Array.isArray(routineData) ? routineData : [];

  const uniqueTimes = validRoutineData.length > 0 
    ? Array.from(new Set(validRoutineData.map(item => item?.time || '')))
      .filter(time => time) // Remove empty times
      .map(time => {
        const slot = validRoutineData.find(item => item?.time === time);
        return {
          originalTime: time,
          displayTime: convertTo12Hour(time),
          classData: slot?.[selectedDay as keyof RoutineClass] || null
        };
      })
      .sort((a, b) => getTimeInMinutes(a.originalTime) - getTimeInMinutes(b.originalTime))
      .filter(slot => slot.classData)
    : [];

  return (
    <div className="overflow-hidden bg-white">
      {/* Day Filter */}
      <div className="flex space-x-2 p-4 bg-gray-50 border-b overflow-x-auto">
        {days.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap
              ${selectedDay === day 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
          >
            {day.charAt(0).toUpperCase() + day.slice(1)}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="flex bg-gray-50 border-b">
        <div className="w-1/3 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
          Time ({selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)})
        </div>
        <div className="w-2/3 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
          Class Details
        </div>
      </div>

      {/* Content */}
      <div className="divide-y divide-gray-200">
        {uniqueTimes.length > 0 ? (
          uniqueTimes.map((slot, index) => (
            <div key={index} className="flex hover:bg-gray-50">
              <div className="w-1/3 px-6 py-4 text-sm text-gray-900">
                {slot.displayTime}
              </div>
              <div className="w-2/3 px-6 py-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-900">
                    {slot.classData && typeof slot.classData === 'object' ? slot.classData.subject : ''}
                  </div>
                  <div className="text-sm text-gray-500">
                    {slot.classData && typeof slot.classData === 'object' ? slot.classData.teacher : ''}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            {!validRoutineData.length 
              ? 'No routine data available' 
              : `No classes scheduled for ${selectedDay}`
            }
          </div>
        )}
      </div>
    </div>
  );
}