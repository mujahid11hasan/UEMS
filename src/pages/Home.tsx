import React, { useState } from 'react';
import { Calendar, Users, Bell, MapPin, X, Phone, Mail, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../hooks/useEvents';

interface RegistrationForm {
  name: string;
  email: string;
  phone: string;
  requirements: string;
}

function Home() {
  const navigate = useNavigate();
  const { user, supabase } = useAuth();
  const { events, loading } = useEvents({ limit: 3 });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [registrationForm, setRegistrationForm] = useState<RegistrationForm>({
    name: '',
    email: '',
    phone: '',
    requirements: '',
  });

  const handleRegistration = async (event: Event) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const { data: existingReg, error: checkError } = await supabase
        .from('registrations')
        .select('id')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingReg) {
        alert('You are already registered for this event.');
        return;
      }

      setSelectedEvent(event);
      setRegistrationForm({
        name: user.user_metadata?.name || '',
        email: user.email || '',
        phone: '',
        requirements: '',
      });
    } catch (error) {
      console.error('Error checking registration:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedEvent) return;

    try {
      const { error } = await supabase
        .from('registrations')
        .insert({
          event_id: selectedEvent.id,
          user_id: user.id,
          requirements: registrationForm.requirements,
          phone: registrationForm.phone,
        });

      if (error) throw error;

      alert(`Successfully registered for ${selectedEvent.title}!`);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error registering for event:', error);
      alert('Failed to register for the event. Please try again.');
    }
  };

  const scrollToUpcomingEvents = () => {
    const upcomingEventsSection = document.getElementById('upcoming-events');
    if (upcomingEventsSection) {
      upcomingEventsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Hero Section */}
      <div className="relative bg-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <h1 className="text-4xl font-bold mb-4">
            University Event Management System
          </h1>
          <p className="text-xl mb-8">
            Streamline your university events with our comprehensive management platform
          </p>
          <button 
            onClick={scrollToUpcomingEvents}
            className="bg-white text-blue-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-300"
          >
            Explore Events
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Calendar className="w-8 h-8" />}
            title="Event Management"
            description="Create, manage, and track university events with ease"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="User Roles"
            description="Dedicated access for students, faculty, and administrators"
          />
          <FeatureCard
            icon={<Bell className="w-8 h-8" />}
            title="Notifications"
            description="Stay updated with event reminders and changes"
          />
        </div>
      </div>

      {/* Upcoming Events Section */}
      <div id="upcoming-events" className="bg-gray-100 py-16 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Upcoming Events</h2>
            <button
              onClick={() => navigate('/events')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View All Events
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No upcoming events scheduled.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map(event => (
                <EventCard
                  key={event.id}
                  title={event.title}
                  description={event.description}
                  date={new Date(event.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  time={event.time}
                  venue={event.venue}
                  category={event.category}
                  image={event.image_url || getEventImage(event.category)}
                  capacity={event.capacity}
                  registrationsCount={event.registrations_count}
                  onRegister={() => handleRegistration(event)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Registration Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Register for {selectedEvent.title}</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} at {selectedEvent.time}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 mt-1">
                <MapPin className="w-4 h-4" />
                <span>{selectedEvent.venue}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitRegistration} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      required
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={registrationForm.name}
                      onChange={(e) => setRegistrationForm({ ...registrationForm, name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      required
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={registrationForm.email}
                      onChange={(e) => setRegistrationForm({ ...registrationForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      required
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={registrationForm.phone}
                      onChange={(e) => setRegistrationForm({ ...registrationForm, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Requirements
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Any accessibility needs or other requirements"
                  value={registrationForm.requirements}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, requirements: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Complete Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300">
      <div className="text-blue-800 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function EventCard({ 
  title, 
  description, 
  date, 
  time, 
  venue, 
  category, 
  image, 
  capacity,
  registrationsCount,
  onRegister 
}) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
      <img src={image} alt={title} className="w-full h-48 object-cover" />
      <div className="p-6">
        <div className="text-sm text-blue-800 font-semibold mb-2 capitalize">{category}</div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-2">{description}</p>
        <div className="text-gray-600">
          <div className="flex items-center mb-1">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{date} at {time}</span>
          </div>
          <div className="flex items-center mb-1">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{venue}</span>
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            <span>{registrationsCount} / {capacity} registered</span>
          </div>
        </div>
        <button 
          onClick={onRegister}
          disabled={registrationsCount >= capacity}
          className={`mt-4 w-full py-2 rounded-md transition duration-300 ${
            registrationsCount >= capacity
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-800 text-white hover:bg-blue-700'
          }`}
        >
          {registrationsCount >= capacity ? 'Event Full' : 'Register Now'}
        </button>
      </div>
    </div>
  );
}

function getEventImage(category: string): string {
  const images = {
    workshop: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000',
    cultural: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000',
    academic: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=1000',
    sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=1000'
  };
  return images[category.toLowerCase()] || images.workshop;
}

export default Home;