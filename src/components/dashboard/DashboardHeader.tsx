import React from 'react';
import { PlusCircle } from 'lucide-react';

interface DashboardHeaderProps {
  userRole: string;
  onCreateEvent: () => void;
  onCreateVenue: () => void;
}

export function DashboardHeader({ userRole, onCreateEvent, onCreateVenue }: DashboardHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, {userRole}</p>
      </div>
      <div className="flex space-x-4">
        <button
          onClick={onCreateVenue}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Add Venue
        </button>
        <button
          onClick={onCreateEvent}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Create Event
        </button>
      </div>
    </div>
  );
}