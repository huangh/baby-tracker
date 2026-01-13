import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DailyTimelineChart from './DailyTimelineChart';

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
    ComposedChart: ({ children, data }) => (
      <div className="recharts-composed-chart" data-testid="composed-chart">
        {children}
        <div data-testid="chart-data">{JSON.stringify(data)}</div>
      </div>
    ),
    Scatter: () => <div className="recharts-scatter" />,
    Line: () => <div className="recharts-line" />,
    XAxis: () => <div className="recharts-x-axis" />,
    YAxis: () => <div className="recharts-y-axis" />,
    CartesianGrid: () => <div className="recharts-cartesian-grid" />,
    Tooltip: () => <div className="recharts-tooltip" />,
    Legend: () => <div className="recharts-legend" />,
  };
});

describe('DailyTimelineChart', () => {
  const config = {
    events: [
      { id: 'feeding', label: 'Feeding', emoji: '🍼' },
      { id: 'diaper', label: 'Diaper', emoji: '💩' }
    ]
  };

  it('renders empty state when no events today', () => {
    // Event yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    render(<DailyTimelineChart events={[{ timestamp: yesterday }]} config={config} />);
    expect(screen.getByText(/No events today/i)).toBeInTheDocument();
  });

  it('renders chart when events exist today', () => {
    const today = new Date();
    today.setHours(10, 0, 0); // 10:00 AM
    
    const events = [
      { eventType: 'feeding', timestamp: today, amount: '100' }
    ];
    
    render(<DailyTimelineChart events={events} config={config} />);
    
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
    
    // Check internal data processing (optional, but good for verifying logic)
    // Currently the data passed to ComposedChart is undefined because Scatter and Line have their own data props in the component code.
    // Wait, <ComposedChart data={undefined}> ? 
    // In DailyTimelineChart.jsx:
    // <ComposedChart margin={{...}}>
    //   <Scatter data={scatterData} ... />
    //   <Line data={milkData} ... />
    // </ComposedChart>
    // So ComposedChart doesn't get data prop, individual components do.
    
    // My mock of ComposedChart renders children.
    // I can't check data on ComposedChart div directly if it's not passed.
    // But I know it renders if 'composed-chart' is present.
  });
});
