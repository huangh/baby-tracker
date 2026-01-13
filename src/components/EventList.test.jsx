import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventList from './EventList';

describe('EventList', () => {
  const config = {
    events: [
      { id: 'feeding', label: 'Feeding', emoji: '🍼' },
      { id: 'diaper', label: 'Diaper', emoji: '💩' }
    ]
  };

  it('renders empty state when no events', () => {
    render(<EventList events={[]} config={config} />);
    expect(screen.getByText('No events recorded yet.')).toBeInTheDocument();
  });

  it('renders events with correct formatting', () => {
    const events = [
      { eventType: 'feeding', timestamp: new Date('2023-01-01T10:00:00'), type: 'bottle', amount: '100' }
    ];
    render(<EventList events={events} config={config} />);
    
    expect(screen.getByText('Feeding')).toBeInTheDocument();
    expect(screen.getByText('🍼')).toBeInTheDocument();
    expect(screen.getByText(/1\/1\/2023, 10:00:00 AM/i)).toBeInTheDocument(); // Depends on locale, might be fragile
    expect(screen.getByText('Type: bottle')).toBeInTheDocument();
    expect(screen.getByText('Amount: 100 ml')).toBeInTheDocument();
  });

  it('sorts events by timestamp descending', () => {
    const events = [
      { eventType: 'feeding', timestamp: new Date('2023-01-01T10:00:00') },
      { eventType: 'diaper', timestamp: new Date('2023-01-01T11:00:00') }
    ];
    render(<EventList events={events} config={config} />);
    
    const items = screen.getAllByText(/(Feeding|Diaper)/);
    // Should be Diaper then Feeding because 11:00 > 10:00
    // Note: getByText matches exact elements. The component renders separate spans for emoji and label inside a container.
    // The structure is: <span class="event-type"><span class="event-emoji">...</span>Label</span>
    // So getByText('Feeding') works.
    
    // We need to check order.
    // getAllByText might return multiple elements if names repeat.
    // Let's rely on container order.
    const eventItems = document.querySelectorAll('.event-item');
    expect(eventItems.length).toBe(2);
    expect(eventItems[0]).toHaveTextContent('Diaper');
    expect(eventItems[1]).toHaveTextContent('Feeding');
  });

  it('handles events without config entry', () => {
    const events = [
      { eventType: 'unknown', timestamp: new Date() }
    ];
    render(<EventList events={events} config={config} />);
    expect(screen.getByText('unknown')).toBeInTheDocument();
  });
});
