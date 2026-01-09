import React, { useState } from 'react';

/**
 * CopyUrlButton Component
 * Button that copies the current URL to clipboard
 */
export default function CopyUrlButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="copy-url-button"
      title="Copy URL to clipboard"
    >
      {copied ? '✓ Copied!' : '📋 Copy URL'}
    </button>
  );
}
