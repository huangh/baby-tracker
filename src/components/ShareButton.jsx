import React, { useState } from 'react';

/**
 * ShareButton Component
 * Button that opens the system share dialog with the current URL
 * Falls back to clipboard copy on unsupported browsers
 */
export default function ShareButton() {
  const [shared, setShared] = useState(false);
  const [fallbackUsed, setFallbackUsed] = useState(false);

  const handleShare = async () => {
    const currentUrl = window.location.href;
    const shareData = {
      title: 'Baby Event Tracker',
      text: 'Check out my baby tracking data',
      url: currentUrl
    };

    // Check if Web Share API is available
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        setShared(true);
        setFallbackUsed(false);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        // User cancelled the share or error occurred
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
          // Fall back to clipboard
          await copyToClipboard(currentUrl);
        }
      }
    } else {
      // Fallback: copy to clipboard
      await copyToClipboard(currentUrl);
    }
  };

  const copyToClipboard = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setFallbackUsed(true);
      setTimeout(() => {
        setShared(false);
        setFallbackUsed(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setShared(true);
        setFallbackUsed(true);
        setTimeout(() => {
          setShared(false);
          setFallbackUsed(false);
        }, 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const getButtonText = () => {
    if (shared) {
      return fallbackUsed ? '✓ Copied!' : '✓ Shared!';
    }
    return '📤 Share';
  };

  return (
    <button
      onClick={handleShare}
      className="share-button"
      title="Share this tracker"
    >
      {getButtonText()}
    </button>
  );
}
