import React from 'react';
import { Calendar, Users, BookOpen, MapPin } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalEvents: number;
    totalRegistrations: number;
    activeEvents: number;
    venues: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Total Events</h3>
          <Calendar className="w-6 h-6 text-blue-600" />
        </div>
        <p className="text-3xl font-bold text-blue-600">{stats.totalEvents}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Total Registrations</h3>
          <Users className="w-6 h-6 text-blue-600" />
        </div>
        <p className="text-3xl font-bold text-blue-600">{stats.totalRegistrations}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Active Events</h3>
          <BookOpen className="w-6 h-6 text-blue-600" />
        </div>
        <p className="text-3xl font-bold text-blue-600">{stats.activeEvents}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Venues</h3>
          <MapPin className="w-6 h-6 text-blue-600" />
        </div>
        <p className="text-3xl font-bold text-blue-600">{stats.venues}</p>
      </div>
    </div>
  );
}