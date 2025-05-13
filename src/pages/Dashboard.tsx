import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { StatsCards } from '../components/dashboard/StatsCards';
import { VenueList } from '../components/dashboard/VenueList';
import { EventList } from '../components/dashboard/EventList';
import { CreateVenueModal } from '../components/dashboard/CreateVenueModal';
import { DeleteConfirmationModal } from '../components/dashboard/DeleteConfirmationModal';

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
  registrations_count: number;
  image_url?: string;
  creator?: {
    name: string;
    role: string;
  };
}

interface Venue {
  id: string;
  name: string;
  address: string;
  capacity: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function Dashboard() {
  const { user, supabase } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [venueError, setVenueError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    activeEvents: 0,
    venues: 0,
    myEvents: 0,
    myEventRegistrations: 0
  });

  const [venueForm, setVenueForm] = useState<{
    name: string;
    address: string;
    capacity: number;
  }>({
    name: '',
    address: '',
    capacity: 100
  });

  useEffect(() => {
    fetchUserRole();
    fetchEvents();
    fetchVenues();
    fetchStats();
  }, [user]);

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, name')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserRole(data.role);
      setUserName(data.name);

      if (data.role !== 'admin') {
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      navigate('/');
    }
  };

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .order('name');

      if (error) throw error;
      setVenues(data || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          creator:profiles!events_created_by_fkey (
            name,
            role
          ),
          registrations:registrations (count)
        `)
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      const processedEvents = eventsData.map(event => ({
        ...event,
        registrations_count: event.registrations?.[0]?.count || 0
      }));

      setEvents(processedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const now = new Date();
      
      // Get all events
      const { data: allEvents } = await supabase
        .from('events')
        .select('id, date, created_by');
      
      // Get all registrations
      const { data: registrations } = await supabase
        .from('registrations')
        .select('id, event_id');
      
      // Get all venues
      const { data: venuesData } = await supabase
        .from('venues')
        .select('id');

      // Calculate stats
      const totalEvents = allEvents?.length || 0;
      const totalRegistrations = registrations?.length || 0;
      const activeEvents = allEvents?.filter(event => new Date(event.date) >= now).length || 0;
      const venuesCount = venuesData?.length || 0;
      
      // Calculate personal stats
      const myEvents = allEvents?.filter(event => event.created_by === user?.id).length || 0;
      const myEventIds = allEvents
        ?.filter(event => event.created_by === user?.id)
        .map(event => event.id) || [];
      const myEventRegistrations = registrations
        ?.filter(reg => myEventIds.includes(reg.event_id))
        .length || 0;

      setStats({
        totalEvents,
        totalRegistrations,
        activeEvents,
        venues: venuesCount,
        myEvents,
        myEventRegistrations
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setVenueError('');

    try {
      const { error } = await supabase
        .from('venues')
        .insert({
          name: venueForm.name,
          address: venueForm.address,
          capacity: venueForm.capacity,
          created_by: user?.id
        });

      if (error) throw error;

      setShowVenueModal(false);
      setVenueForm({
        name: '',
        address: '',
        capacity: 100
      });
      fetchVenues();
      fetchStats();
    } catch (error: any) {
      setVenueError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVenue) return;
    
    setIsSubmitting(true);
    setVenueError('');

    try {
      const { error } = await supabase
        .from('venues')
        .update({
          name: venueForm.name,
          address: venueForm.address,
          capacity: venueForm.capacity
        })
        .eq('id', editingVenue.id);

      if (error) throw error;

      setShowVenueModal(false);
      setEditingVenue(null);
      setVenueForm({
        name: '',
        address: '',
        capacity: 100
      });
      fetchVenues();
    } catch (error: any) {
      setVenueError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVenue = async (venueId: string) => {
    try {
      setIsDeleting(true);
      setDeleteError(null);

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('venue', venues.find(v => v.id === venueId)?.name)
        .limit(1);

      if (eventError) throw eventError;

      if (eventData && eventData.length > 0) {
        setDeleteError('This venue is in use and cannot be deleted.');
        return;
      }

      const { error } = await supabase
        .from('venues')
        .delete()
        .eq('id', venueId);

      if (error) throw error;

      setVenues(venues.filter(venue => venue.id !== venueId));
      setShowDeleteConfirm(null);
      fetchStats();
    } catch (error: any) {
      console.error('Error deleting venue:', error);
      setDeleteError(error.message);
    } finally {
      setIsDeleting(false);
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
      fetchStats();
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
        </div>

        <DashboardHeader
          userRole={userRole}
          onCreateEvent={() => navigate('/events/create')}
          onCreateVenue={() => {
            setShowVenueModal(true);
            setEditingVenue(null);
            setVenueForm({
              name: '',
              address: '',
              capacity: 100
            });
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">My Events</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.myEvents}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">My Event Registrations</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.myEventRegistrations}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Events</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.activeEvents}</p>
          </div>
        </div>

        <StatsCards stats={stats} />

        <VenueList
          venues={venues}
          onEdit={(venue) => {
            setEditingVenue(venue);
            setVenueForm({
              name: venue.name,
              address: venue.address,
              capacity: venue.capacity
            });
            setShowVenueModal(true);
          }}
          onDelete={(id) => setShowDeleteConfirm(id)}
        />

        <EventList
          events={events}
          onDelete={(id) => setShowDeleteConfirm(id)}
        />

        <CreateVenueModal
          show={showVenueModal}
          onClose={() => {
            setShowVenueModal(false);
            setEditingVenue(null);
            setVenueError('');
          }}
          onSubmit={editingVenue ? handleUpdateVenue : handleCreateVenue}
          venueForm={venueForm}
          setVenueForm={setVenueForm}
          isSubmitting={isSubmitting}
          error={venueError}
          editingVenue={editingVenue}
        />

        <DeleteConfirmationModal
          show={!!showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(null);
            setDeleteError(null);
          }}
          onConfirm={() => {
            if (!showDeleteConfirm) return;
            const isEvent = events.find(e => e.id === showDeleteConfirm);
            if (isEvent) {
              handleDeleteEvent(showDeleteConfirm);
            } else {
              handleDeleteVenue(showDeleteConfirm);
            }
          }}
          isDeleting={isDeleting}
          error={deleteError}
          itemType={events.find(e => e.id === showDeleteConfirm) ? 'event' : 'venue'}
        />
      </div>
    </div>
  );
}

export default Dashboard;