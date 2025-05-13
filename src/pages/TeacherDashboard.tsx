import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, MapPin, Clock, Edit, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  category: string;
  capacity: number;
  created_by: string;
  image_url?: string;
  registrations_count: number;
}

interface Stats {
  totalEvents: number;
  totalRegistrations: number;
}

function TeacherDashboard() {
  const { user, supabase } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Stats>({ totalEvents: 0, totalRegistrations: 0 });
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserRole();
    fetchEventsAndStats();
  }, []);

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, name')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserName(data.name);

      if (data.role !== 'teacher') {
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      navigate('/');
    }
  };

  const fetchEventsAndStats = async () => {
    try {
      // Fetch events with registration counts
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          registrations:registrations (count)
        `)
        .eq('created_by', user?.id)
        .order('date', { ascending: true });

      if (eventsError) throw eventsError;

      // Process events and calculate stats
      const processedEvents = eventsData.map(event => ({
        ...event,
        registrations_count: event.registrations?.[0]?.count || 0
      }));

      setEvents(processedEvents);

      // Calculate total stats
      const totalEvents = processedEvents.length;
      const totalRegistrations = processedEvents.reduce(
        (sum, event) => sum + (event.registrations_count || 0),
        0
      );

      setStats({ totalEvents, totalRegistrations });
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      setIsDeleting(true);
      setDeleteError(null);

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(events.filter(event => event.id !== eventId));
      setShowDeleteConfirm(null);
      
      // Update stats after deletion
      setStats(prev => ({
        ...prev,
        totalEvents: prev.totalEvents - 1,
        totalRegistrations: prev.totalRegistrations - (events.find(e => e.id === eventId)?.registrations_count || 0)
      }));
    } catch (error: any) {
      console.error('Error deleting event:', error);
      setDeleteError('Failed to delete event. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{userName}'s Dashboard</h1>
            <p className="text-gray-600">Welcome back</p>
          </div>
          <button
            onClick={() => navigate('/events/create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Event
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Events Created</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalEvents}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Registrations</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalRegistrations}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Your Events</h2>
            {events.length === 0 ? (
              <p className="text-gray-500">You haven't created any events yet.</p>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">{event.title}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {event.category}
                        </span>
                        <button
                          onClick={() => navigate(`/events/edit/${event.id}`)}
                          className="p-1 text-gray-600 hover:text-blue-600"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(event.id)}
                          className="p-1 text-gray-600 hover:text-red-600"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
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
                          <span className="text-red-600">0 seats available</span>
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
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Delete Confirmation</h3>
              {deleteError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {deleteError}
                </div>
              )}
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this event? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(null);
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteEvent(showDeleteConfirm)}
                  className={`px-4 py-2 text-white rounded-md ${
                    isDeleting
                      ? 'bg-red-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherDashboard;