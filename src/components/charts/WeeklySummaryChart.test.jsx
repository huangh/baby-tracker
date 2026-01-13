import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WeeklySummaryChart from './WeeklySummaryChart';

// Mock ResizeObserver
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
    BarChart: ({ children, data }) => (
      <div className="recharts-bar-chart" data-testid="bar-chart">
        {children}
        <div data-testid="chart-data">{JSON.stringify(data)}</div>
      </div>
    ),
    Bar: () => <div className="recharts-bar" />,
    XAxis: () => <div className="recharts-x-axis" />,
    YAxis: () => <div className="recharts-y-axis" />,
    CartesianGrid: () => <div className="recharts-cartesian-grid" />,
    Tooltip: () => <div className="recharts-tooltip" />,
    Legend: () => <div className="recharts-legend" />,
  };
});

describe('WeeklySummaryChart', () => {
  it('renders empty state when no events', () => {
    render(<WeeklySummaryChart events={[]} />);
    expect(screen.getByText('No events to display.')).toBeInTheDocument();
  });

  it('renders chart with data', () => {
    const today = new Date();
    const events = [
      { eventType: 'feeding', timestamp: today }
    ];
    
    render(<WeeklySummaryChart events={events} />);
    
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    
    // Check data passed to BarChart
    const dataEl = screen.getByTestId('chart-data');
    const data = JSON.parse(dataEl.textContent);
    
    expect(data.length).toBe(7);
    const todayData = data[data.length - 1];
    expect(todayData.label).toBe('Today');
    expect(todayData.Feeds).toBe(1);
  });
});
