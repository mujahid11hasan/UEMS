import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { format } from 'date-fns';

// Types
export interface Venue {
  id: string;
  name: string;
  description: string;
  capacity: number;
  imageUrl: string;
  resources: string[];
}

export interface Booking {
  id: string;
  venueId: string;
  eventId: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdBy: string;
}

export interface Resource {
  id: string;
  name: string;
  venueId: string;
  type: string;
  status: 'available' | 'in-use' | 'maintenance';
}

interface AppState {
  venues: Venue[];
  bookings: Booking[];
  resources: Resource[];
}

// Initial state
const initialState: AppState = {
  venues: [
    {
      id: '1',
      name: 'Main Auditorium',
      description: 'Large auditorium with stage and professional sound system',
      capacity: 500,
      imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=1000',
      resources: ['Projector', 'Sound System', 'Stage Lighting', 'Podium'],
    },
    {
      id: '2',
      name: 'Conference Hall',
      description: 'Modern conference space with flexible seating arrangement',
      capacity: 200,
      imageUrl: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&q=80&w=1000',
      resources: ['Video Conferencing', 'Whiteboard', 'Coffee Station'],
    },
  ],
  bookings: [],
  resources: [],
};

// Action types
type Action =
  | { type: 'ADD_VENUE'; payload: Venue }
  | { type: 'UPDATE_VENUE'; payload: Venue }
  | { type: 'DELETE_VENUE'; payload: string }
  | { type: 'ADD_BOOKING'; payload: Booking }
  | { type: 'UPDATE_BOOKING'; payload: Booking }
  | { type: 'DELETE_BOOKING'; payload: string }
  | { type: 'ADD_RESOURCE'; payload: Resource }
  | { type: 'UPDATE_RESOURCE'; payload: Resource }
  | { type: 'DELETE_RESOURCE'; payload: string };

// Reducer
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_VENUE':
      return {
        ...state,
        venues: [...state.venues, action.payload],
      };
    case 'UPDATE_VENUE':
      return {
        ...state,
        venues: state.venues.map((venue) =>
          venue.id === action.payload.id ? action.payload : venue
        ),
      };
    case 'DELETE_VENUE':
      return {
        ...state,
        venues: state.venues.filter((venue) => venue.id !== action.payload),
      };
    case 'ADD_BOOKING':
      return {
        ...state,
        bookings: [...state.bookings, action.payload],
      };
    case 'UPDATE_BOOKING':
      return {
        ...state,
        bookings: state.bookings.map((booking) =>
          booking.id === action.payload.id ? action.payload : booking
        ),
      };
    case 'DELETE_BOOKING':
      return {
        ...state,
        bookings: state.bookings.filter((booking) => booking.id !== action.payload),
      };
    case 'ADD_RESOURCE':
      return {
        ...state,
        resources: [...state.resources, action.payload],
      };
    case 'UPDATE_RESOURCE':
      return {
        ...state,
        resources: state.resources.map((resource) =>
          resource.id === action.payload.id ? action.payload : resource
        ),
      };
    case 'DELETE_RESOURCE':
      return {
        ...state,
        resources: state.resources.filter((resource) => resource.id !== action.payload),
      };
    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Utility functions
export function checkVenueAvailability(
  bookings: Booking[],
  venueId: string,
  startTime: string,
  endTime: string
): boolean {
  return !bookings.some(
    (booking) =>
      booking.venueId === venueId &&
      booking.status !== 'cancelled' &&
      ((new Date(startTime) >= new Date(booking.startTime) &&
        new Date(startTime) < new Date(booking.endTime)) ||
        (new Date(endTime) > new Date(booking.startTime) &&
          new Date(endTime) <= new Date(booking.endTime)))
  );
}

export function getVenueBookings(
  bookings: Booking[],
  venueId: string,
  startDate: Date,
  endDate: Date
): Booking[] {
  return bookings.filter(
    (booking) =>
      booking.venueId === venueId &&
      new Date(booking.startTime) >= startDate &&
      new Date(booking.endTime) <= endDate
  );
}

export function formatBookingTime(date: string): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}