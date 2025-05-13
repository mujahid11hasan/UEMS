import React from 'react';
import { Calendar, Clock, MapPin, Users, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  category: string;
  capacity: number;
  image_url?: string;
  registrations_count: number;
  creator?: {
    name: string;
    role: string;
  };
}

interface EventListProps {
  events: Event[];
  onDelete: (id: string) => void;
}

export function EventList({ events, onDelete }: EventListProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">All Events</h2>
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="border-b pb-4 last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{event.title}</h3>
                  {event.creator && (
                    <p className="text-sm text-gray-500">
                      Created by {event.creator.name} ({event.creator.role})
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {event.category}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate(`/events/edit/${event.id}`)}
                      className="p-1 text-gray-600 hover:text-blue-600"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(event.id)}
                      className="p-1 text-gray-600 hover:text-red-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                {event.image_url && (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-24 h-24 object-cover rounded-md"
                  />
                )}
                <div className="flex-1">
                  <p className="text-gray-600 mb-2">{event.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {event.time}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.venue}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      {event.registrations_count >= event.capacity ? (
                        <span className="text-red-600 font-medium">0 seats available</span>
                      ) : (
                        <span>
                          {event.capacity - event.registrations_count} seats available
                          <span className="text-gray-400 ml-1">
                            ({event.registrations_count}/{event.capacity})
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}