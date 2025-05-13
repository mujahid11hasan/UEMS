/*
  # Add Sample Events

  1. Changes
    - Insert sample events into the events table
    - Events cover different categories and dates
    - Each event has realistic details and capacity
*/

-- Insert sample events
INSERT INTO events (title, description, date, time, venue, category, capacity, created_at)
VALUES
  (
    'Tech Workshop 2024',
    'Learn the latest web development technologies and best practices.',
    '2024-03-15',
    '10:00',
    'Main Auditorium',
    'workshop',
    50,
    now()
  ),
  (
    'Annual Cultural Fest',
    'Celebrate diversity through music, dance, and art performances.',
    '2024-03-20',
    '18:00',
    'University Ground',
    'cultural',
    200,
    now()
  ),
  (
    'Research Symposium',
    'Present and discuss the latest research findings in various fields.',
    '2024-03-25',
    '09:00',
    'Conference Hall',
    'academic',
    100,
    now()
  );