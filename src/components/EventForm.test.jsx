import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EventForm from './EventForm';

// Mock fetch to prevent network requests during tests
global.fetch = vi.fn(() => Promise.resolve({
    json: () => Promise.resolve({}),
    catch: () => {}
}));

describe('EventForm', () => {
  const mockSubmit = vi.fn();
  const feedConfig = {
    id: 'feeding',
    label: 'Feeding',
    fields: [
      { id: 'timestamp', type: 'datetime', label: 'Time', default: 'now', required: true },
      { id: 'type', type: 'select', label: 'Type', options: [{ value: 'breast', label: 'Breast' }, { value: 'bottle', label: 'Bottle' }], required: true },
      { id: 'amount', type: 'number', label: 'Amount (ml)', min: 0 }
    ]
  };

  beforeEach(() => {
    mockSubmit.mockClear();
    vi.clearAllMocks();
  });

  it('renders form fields based on config', () => {
    render(<EventForm eventTypeConfig={feedConfig} onSubmit={mockSubmit} />);
    
    expect(screen.getByText('Feeding')).toBeInTheDocument();
    // Use a custom matcher to find the label text 'Time' (ignoring the * span)
    expect(screen.getByText((content, element) => {
      return element.tagName.toLowerCase() === 'label' && content.includes('Time');
    })).toBeInTheDocument();
    expect(screen.getByLabelText(/Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
  });

  it('handles input changes', () => {
    render(<EventForm eventTypeConfig={feedConfig} onSubmit={mockSubmit} />);
    
    const amountInput = screen.getByLabelText(/Amount/i);
    fireEvent.change(amountInput, { target: { value: '100' } });
    
    expect(amountInput.value).toBe('100');
  });

  it('validates required fields', () => {
    render(<EventForm eventTypeConfig={feedConfig} onSubmit={mockSubmit} />);
    
    const submitButton = screen.getByText('Add Event');
    fireEvent.click(submitButton);
    
    // Should show error for Type because it is required and empty
    // Timestamp has default 'now', so it might be populated
    expect(screen.getByText('Type is required')).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('submits form with correct data', () => {
    render(<EventForm eventTypeConfig={feedConfig} onSubmit={mockSubmit} />);
    
    // Select type
    const typeSelect = screen.getByLabelText(/Type/i);
    fireEvent.change(typeSelect, { target: { value: 'bottle' } });
    
    // Enter amount
    const amountInput = screen.getByLabelText(/Amount/i);
    fireEvent.change(amountInput, { target: { value: '150' } });
    
    const submitButton = screen.getByText('Add Event');
    fireEvent.click(submitButton);
    
    expect(mockSubmit).toHaveBeenCalledTimes(1);
    const submittedData = mockSubmit.mock.calls[0][0];
    expect(submittedData.eventType).toBe('feeding');
    expect(submittedData.type).toBe('bottle');
    expect(submittedData.amount).toBe('150'); // Inputs are strings usually, unless parsed. The component parses it?
    // Looking at code: `const value = formData[field.id];` -> validation parses parseFloat but submission sends `formData`.
    // Wait, the component validation parses it: `const numValue = parseFloat(value);` but that's just for validation check.
    // The `onSubmit` sends `...formData`. So it sends string '150'.
    
    expect(submittedData.timestamp).toBeDefined();
  });

  it('displays error message if no config provided', () => {
    render(<EventForm eventTypeConfig={null} onSubmit={mockSubmit} />);
    expect(screen.getByText('No event type selected')).toBeInTheDocument();
  });
});
