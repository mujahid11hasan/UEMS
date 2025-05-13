import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, MapPin, Clock, X, Download, Filter, ArrowUpDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format, isAfter, isBefore, isToday } from 'date-fns';
import { jsPDF } from 'jspdf';

interface Registration {
  id: string;
  event: {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    category: string;
    capacity: number;
    image_url?: string;
  };
  created_at: string;
  phone?: string;
}

interface Stats {
  totalRegistrations: number;
  canceledRegistrations: number;
  upcomingEvents: number;
}

function StudentDashboard() {
  const { user, supabase } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalRegistrations: 0,
    canceledRegistrations: 0,
    upcomingEvents: 0,
  });
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('event-date');

  useEffect(() => {
    if (user) {
      fetchUserRole();
      fetchRegistrations();
      fetchStats();
    } else {
      navigate('/login');
    }
  }, [user]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [registrations, filter, sortBy]);

  const isEventPassed = (date: string, time: string): boolean => {
    const eventDateTime = new Date(`${date}T${time}`);
    return eventDateTime < new Date();
  };

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, name')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserName(data.name);

      if (data.role !== 'student') {
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      navigate('/');
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      const { count: totalCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      const today = new Date().toISOString().split('T')[0];
      const { count: upcomingCount } = await supabase
        .from('registrations')
        .select('events!inner(*)', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('events.date', today);

      const canceledCount = 0;

      setStats({
        totalRegistrations: totalCount || 0,
        upcomingEvents: upcomingCount || 0,
        canceledRegistrations: canceledCount,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRegistrations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id,
          created_at,
          event:events (
            id,
            title,
            description,
            date,
            time,
            venue,
            category,
            capacity,
            image_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...registrations];

    if (filter === 'upcoming') {
      filtered = filtered.filter(reg => 
        !isEventPassed(reg.event.date, reg.event.time)
      );
    } else if (filter === 'past') {
      filtered = filtered.filter(reg => 
        isEventPassed(reg.event.date, reg.event.time)
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === 'event-date') {
        return new Date(a.event.date).getTime() - new Date(b.event.date).getTime();
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredRegistrations(filtered);
  };

  const getEventStatus = (date: string, time: string) => {
    const eventDateTime = new Date(`${date}T${time}`);
    const now = new Date();

    if (isEventPassed(date, time)) {
      return { label: 'Completed', class: 'bg-gray-100 text-gray-800' };
    } else if (isToday(eventDateTime)) {
      return { label: 'Today', class: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { label: 'Upcoming', class: 'bg-green-100 text-green-800' };
    }
  };

  const handleCancelRegistration = async (registrationId: string) => {
    if (!user) return;

    try {
      setIsCancelling(true);
      setCancelError(null);

      // Get the registration details to check event date
      const registration = registrations.find(reg => reg.id === registrationId);
      if (!registration) {
        throw new Error('Registration not found');
      }

      // Check if event has passed
      if (isEventPassed(registration.event.date, registration.event.time)) {
        throw new Error('Cannot cancel registration for past events');
      }

      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', registrationId)
        .eq('user_id', user.id);

      if (error) throw error;

      setRegistrations(prevRegistrations => 
        prevRegistrations.filter(reg => reg.id !== registrationId)
      );
      setShowCancelConfirm(null);
      fetchStats();
    
    } catch (error: any) {
      console.error('Error cancelling registration:', error);
      setCancelError(error.message || 'Could not cancel registration. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const downloadEventInfo = (registration: Registration) => {
    const doc = new jsPDF();
    const event = registration.event;
    
    doc.setFontSize(20);
    doc.text(event.title, 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Date: ${format(new Date(event.date), 'PPP')}`, 20, 40);
    doc.text(`Time: ${event.time}`, 20, 50);
    doc.text(`Venue: ${event.venue}`, 20, 60);
    doc.text(`Category: ${event.category}`, 20, 70);
    doc.text(`Registration Date: ${format(new Date(registration.created_at), 'PPP')}`, 20, 80);
    
    doc.save(`${event.title}-registration.pdf`);
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
            onClick={() => navigate('/events')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Browse Events
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Registrations</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalRegistrations}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Canceled Registrations</h3>
            <p className="text-3xl font-bold text-red-600">{stats.canceledRegistrations}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Upcoming Events</h3>
            <p className="text-3xl font-bold text-green-600">{stats.upcomingEvents}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Filter className="w-5 h-5 text-gray-400 mr-2" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Events</option>
                  <option value="upcoming">Upcoming Events</option>
                  <option value="past">Past Events</option>
                </select>
              </div>
              <div className="flex items-center">
                <ArrowUpDown className="w-5 h-5 text-gray-400 mr-2" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="event-date">Sort by Event Date</option>
                  <option value="registration-date">Sort by Registration Date</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Your Registrations</h2>
            {filteredRegistrations.length === 0 ? (
              <p className="text-gray-500">No registrations found.</p>
            ) : (
              <div className="space-y-6">
                {filteredRegistrations.map((registration) => {
                  const status = getEventStatus(registration.event.date, registration.event.time);
                  const eventPassed = isEventPassed(registration.event.date, registration.event.time);
                  
                  return (
                    <div key={registration.id} className="border rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          {registration.event.image_url && (
                            <img
                              src={registration.event.image_url}
                              alt={registration.event.title}
                              className="w-24 h-24 object-cover rounded-md"
                            />
                          )}
                          <div>
                            <h3 className="text-lg font-semibold">{registration.event.title}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm ${status.class}`}>
                              {status.label}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => downloadEventInfo(registration)}
                            className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Info
                          </button>
                          {!eventPassed && (
                            <button
                              onClick={() => setShowCancelConfirm(registration.id)}
                              className="px-3 py-2 text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Cancel Registration
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4">{registration.event.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {format(new Date(registration.event.date), 'PPP')}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          {registration.event.time}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {registration.event.venue}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Capacity: {registration.event.capacity}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Cancel Registration</h3>
              {cancelError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {cancelError}
                </div>
              )}
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel your registration for{' '}
                <span className="font-semibold">
                  {registrations.find(r => r.id === showCancelConfirm)?.event.title}
                </span>
                ?
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowCancelConfirm(null);
                    setCancelError(null);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isCancelling}
                >
                  Keep Registration
                </button>
                <button
                  onClick={() => handleCancelRegistration(showCancelConfirm)}
                  className={`px-4 py-2 text-white rounded-md ${
                    isCancelling
                      ? 'bg-red-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  disabled={isCancelling}
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;