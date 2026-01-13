import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DateTimePicker from './DateTimePicker';

// Mock fetch for agent logs
global.fetch = vi.fn(() => Promise.resolve({
    json: () => Promise.resolve({}),
    catch: () => {}
}));

describe('DateTimePicker', () => {
  it('renders correctly', () => {
    const handleChange = vi.fn();
    render(<DateTimePicker label="Date Time" value={new Date()} onChange={handleChange} />);
    
    expect(screen.getByText('Date Time')).toBeInTheDocument();
    expect(screen.getByText('Use current time')).toBeInTheDocument();
  });

  it('toggles "Use current time"', () => {
    const handleChange = vi.fn();
    // Start with a date far in the past so "Use current time" is initially false
    const pastDate = new Date('2020-01-01');
    render(<DateTimePicker label="Date Time" value={pastDate} onChange={handleChange} />);
    
    const checkbox = screen.getByLabelText('Use current time');
    expect(checkbox).not.toBeChecked();
    
    // Click to check
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(handleChange).toHaveBeenCalled(); // Should call onChange with new Date()
  });

  it('shows date picker when "Use current time" is unchecked', () => {
    const handleChange = vi.fn();
    const pastDate = new Date('2020-01-01');
    render(<DateTimePicker label="Date Time" value={pastDate} onChange={handleChange} />);
    
    const checkbox = screen.getByLabelText('Use current time');
    expect(checkbox).not.toBeChecked();
    
    // DatePicker input should be visible
    // React DatePicker usually renders an input
    const inputs = screen.getAllByRole('textbox'); 
    // Usually the date picker input is a textbox.
    expect(inputs.length).toBeGreaterThan(0);
  });
});
