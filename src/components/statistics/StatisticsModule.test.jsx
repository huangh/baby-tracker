import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatisticsModule from './StatisticsModule';

describe('StatisticsModule', () => {
  it('renders statistics correctly', () => {
    // 2 feeds, 1 hour apart
    const events = [
      { eventType: 'feeding', timestamp: new Date('2023-01-01T10:00:00') },
      { eventType: 'feeding', timestamp: new Date('2023-01-01T11:00:00') }
    ];
    
    render(<StatisticsModule events={events} />);
    
    expect(screen.getByText('Statistics')).toBeInTheDocument();
    expect(screen.getByText('Avg Time Between Feeds:')).toBeInTheDocument();
    expect(screen.getByText('1h')).toBeInTheDocument();
  });

  it('handles empty events', () => {
    render(<StatisticsModule events={[]} />);
    expect(screen.getByText('N/A (need at least 2 feeds)')).toBeInTheDocument();
  });
});
