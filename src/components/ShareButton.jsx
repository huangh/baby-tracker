import React, { useState } from 'react';
import { generateShareableUrl } from '../utils/urlState';

/**
 * ShareButton Component
 * Button that opens the system share dialog with the current URL
 * Supports optional password encryption for the shared data
 */
export default function ShareButton({ babyName = 'Baby', events = [] }) {
  const [showDialog, setShowDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleShareClick = () => {
    setShowDialog(true);
    setPassword('');
    setConfirmPassword('');
    setUsePassword(false);
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    setShowDialog(false);
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const handleShare = async () => {
    // Validate passwords if encryption is enabled
    if (usePassword) {
      if (!password) {
        setError('Please enter a password');
        return;
      }
      if (password.length < 4) {
        setError('Password must be at least 4 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setSharing(true);
    setError('');

    try {
      // Serialize events for URL
      const serializedEvents = events.map(event => ({
        ...event,
        timestamp: event.timestamp instanceof Date 
          ? event.timestamp.toISOString() 
          : event.timestamp
      }));

      // Generate URL (encrypted if password provided)
      const shareUrl = await generateShareableUrl(
        serializedEvents,
        null,
        usePassword ? password : null
      );

      const shareData = {
        title: `${babyName}'s Tracker`,
        text: `Check out ${babyName}'s tracking data${usePassword ? ' (password protected)' : ''}`,
        url: shareUrl
      };

      // Check if Web Share API is available
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        setSuccess('Shared successfully!');
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        // Fallback: copy to clipboard
        await copyToClipboard(shareUrl);
        setSuccess('URL copied to clipboard!');
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // User cancelled - just close dialog
        handleClose();
      } else {
        console.error('Share failed:', err);
        setError('Failed to share. Please try again.');
      }
    } finally {
      setSharing(false);
    }
  };

  const copyToClipboard = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  return (
    <>
      <button
        onClick={handleShareClick}
        className="share-button"
        title="Share this tracker"
      >
        📤 Share
      </button>

      {showDialog && (
        <div className="share-dialog-overlay" onClick={handleClose}>
          <div className="share-dialog" onClick={e => e.stopPropagation()}>
            <h3>Share {babyName}'s Tracker</h3>
            
            <div className="share-dialog-content">
              <label className="password-toggle">
                <input
                  type="checkbox"
                  checked={usePassword}
                  onChange={(e) => setUsePassword(e.target.checked)}
                />
                <span>Password protect this link</span>
              </label>

              {usePassword && (
                <div className="password-fields">
                  <div className="form-field">
                    <label htmlFor="share-password">Password</label>
                    <input
                      id="share-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="share-confirm-password">Confirm Password</label>
                    <input
                      id="share-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      autoComplete="new-password"
                    />
                  </div>
                  <p className="password-hint">
                    Recipients will need this password to view the data.
                  </p>
                </div>
              )}

              {error && <p className="share-error">{error}</p>}
              {success && <p className="share-success">{success}</p>}
            </div>

            <div className="share-dialog-actions">
              <button
                onClick={handleClose}
                className="share-dialog-cancel"
                disabled={sharing}
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                className="share-dialog-confirm"
                disabled={sharing}
              >
                {sharing ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
