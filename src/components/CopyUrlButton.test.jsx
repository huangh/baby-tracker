import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CopyUrlButton from './CopyUrlButton';

describe('CopyUrlButton', () => {
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    if (originalClipboard) {
      navigator.clipboard = originalClipboard;
    } else {
        // @ts-ignore
        delete navigator.clipboard;
    }
  });

  it('renders correctly', () => {
    render(<CopyUrlButton />);
    expect(screen.getByText('📋 Copy URL')).toBeInTheDocument();
  });

  it('copies URL and shows feedback', async () => {
    render(<CopyUrlButton />);
    const button = screen.getByText('📋 Copy URL');
    
    fireEvent.click(button);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href);
    
    // Should show "Copied!"
    await waitFor(() => {
        expect(screen.getByText('✓ Copied!')).toBeInTheDocument();
    });
    
    // Should revert after 2 seconds
    // We use fake timers to skip wait
    // vi.useFakeTimers();
    // fireEvent.click(button);
    // vi.advanceTimersByTime(2000);
    // expect(screen.getByText('📋 Copy URL')).toBeInTheDocument();
    // vi.useRealTimers();
  });

  it('handles fallback if clipboard API fails', async () => {
     // Mock writeText to fail
     navigator.clipboard.writeText.mockRejectedValue(new Error('Failed'));
     
     // Mock document.execCommand
     document.execCommand = vi.fn(() => true);
     
     render(<CopyUrlButton />);
     const button = screen.getByText('📋 Copy URL');
     
     fireEvent.click(button);
     
     await waitFor(() => {
         expect(document.execCommand).toHaveBeenCalledWith('copy');
         expect(screen.getByText('✓ Copied!')).toBeInTheDocument();
     });
  });
});
