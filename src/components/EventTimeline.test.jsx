import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EventTimeline from './EventTimeline';

// Mock ResizeObserver for Recharts ResponsiveContainer
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Recharts
vi.mock('recharts', () => {
  const OriginalModule = vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => <div className="recharts-responsive-container">{children}</div>,
    ScatterChart: ({ children, data }) => (
      <div className="recharts-scatter-chart" data-testid="scatter-chart">
        {children}
        <div data-testid="chart-data">{JSON.stringify(data)}</div>
      </div>
    ),
    Scatter: () => <div className="recharts-scatter" />,
    XAxis: () => <div className="recharts-x-axis" />,
    YAxis: () => <div className="recharts-y-axis" />,
    CartesianGrid: () => <div className="recharts-cartesian-grid" />,
    Tooltip: () => <div className="recharts-tooltip" />,
    ReferenceLine: () => <div className="recharts-reference-line" />,
    Brush: ({ onChange }) => (
      <div className="recharts-brush">
        <button onClick={() => onChange({ startIndex: 0, endIndex: 1 })}>Simulate Brush</button>
      </div>
    ),
  };
});

describe('EventTimeline', () => {
  const config = {
    events: [
      { id: 'feeding', label: 'Feeding', emoji: '🍼', categories: [
          { id: 'bottle', label: 'Bottle', emoji: '🍼' },
          { id: 'breast', label: 'Breast', emoji: '🤰' }
      ]},
      { id: 'diaper', label: 'Diaper', emoji: '💩' }
    ]
  };

  const events = [
    { eventType: 'feeding', type: 'bottle', timestamp: new Date('2023-01-01T10:00:00') },
    { eventType: 'diaper', timestamp: new Date('2023-01-01T11:00:00') }
  ];

  it('renders empty state when no events', () => {
    render(<EventTimeline events={[]} config={config} />);
    expect(screen.getByText('No events to display. Add some events to see them on the timeline!')).toBeInTheDocument();
  });

  it('renders chart when events exist', () => {
    render(<EventTimeline events={events} config={config} />);
    expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
    expect(screen.getByText('Event Timeline')).toBeInTheDocument();
  });

  it('maps events to chart data correctly', () => {
    render(<EventTimeline events={events} config={config} />);
    const dataEl = screen.getByTestId('chart-data');
    const data = JSON.parse(dataEl.textContent);
    
    // Check feeding event
    const feedingPoint = data.find(d => d.eventType === 'feeding');
    expect(feedingPoint).toBeDefined();
    expect(feedingPoint.category).toBe('bottle');
    expect(feedingPoint.y).toBeDefined(); // Should correspond to row index

    // Check diaper event
    const diaperPoint = data.find(d => d.eventType === 'diaper');
    expect(diaperPoint).toBeDefined();
    expect(diaperPoint.emoji).toBe('💩');
  });

  it('renders legend correctly', () => {
    render(<EventTimeline events={events} config={config} />);
    // Feeding subcategories
    expect(screen.getByText('Feeding: Bottle')).toBeInTheDocument();
    expect(screen.getByText('Feeding: Breast')).toBeInTheDocument();
    // Diaper
    expect(screen.getByText('Diaper')).toBeInTheDocument();
  });
});
