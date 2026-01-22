import React, { useState, useEffect, useRef } from 'react';

/**
 * MobileEventInput Component
 * Mobile-optimized event input with large buttons, scroll wheel for amounts,
 * and toggle buttons for pee/poop
 */
export default function MobileEventInput({ events, onSubmit, config, chartsSectionRef }) {
  const [feedType, setFeedType] = useState(null); // 'breastmilk', 'formula', 'bottle'
  const [feedAmount, setFeedAmount] = useState(0);
  const [peeSelected, setPeeSelected] = useState(false);
  const [poopSelected, setPoopSelected] = useState(false);
  const [notes, setNotes] = useState('');
  const [showFeedOptions, setShowFeedOptions] = useState(false);
  
  const amountInputRef = useRef(null);

  // Calculate average of last 2 feed amounts
  const calculateAverageFeedAmount = () => {
    const feedingEvents = (events || [])
      .filter(event => event.eventType === 'feeding' && event.amount)
      .sort((a, b) => {
        const timeA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
        const timeB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
        return timeB - timeA; // Most recent first
      })
      .slice(0, 2)
      .map(event => parseFloat(event.amount))
      .filter(amount => !isNaN(amount) && amount > 0);

    if (feedingEvents.length === 0) return 0;
    
    const sum = feedingEvents.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / feedingEvents.length);
  };

  // Get slider config from feeding event config
  const feedingConfig = config?.events?.find(e => e.id === 'feeding');
  const amountField = feedingConfig?.fields?.find(f => f.id === 'amount');
  const sliderConfig = amountField?.slider || { min: 0, max: 300, step: 5 };
  const sliderMin = sliderConfig.min || 0;
  const sliderMax = sliderConfig.max || 300;
  const sliderStep = sliderConfig.step || 5;

  // Set default amount when feed type is selected (centered on average of last 2)
  useEffect(() => {
    if (feedType && feedAmount === 0) {
      const avgAmount = calculateAverageFeedAmount();
      // Default to 60ml if no history, otherwise use average
      const defaultAmount = avgAmount || 60;
      // Ensure it's within slider bounds
      const clampedAmount = Math.max(sliderMin, Math.min(sliderMax, defaultAmount));
      setFeedAmount(clampedAmount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedType]);

  const handleFeedClick = () => {
    setShowFeedOptions(!showFeedOptions);
  };

  const handleFeedTypeSelect = (type) => {
    setFeedType(type);
    setShowFeedOptions(false);
    const avgAmount = calculateAverageFeedAmount();
    const defaultAmount = avgAmount || 60;
    const clampedAmount = Math.max(sliderMin, Math.min(sliderMax, defaultAmount));
    setFeedAmount(clampedAmount);
  };

  const handleAmountChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setFeedAmount(value);
  };

  const handlePeeToggle = () => {
    setPeeSelected(!peeSelected);
  };

  const handlePoopToggle = () => {
    setPoopSelected(!poopSelected);
  };

  const handleSubmit = () => {
    const now = new Date();
    const baseId = Date.now();
    const eventsToSubmit = [];

    // Submit feeding event if feed type is selected
    if (feedType) {
      eventsToSubmit.push({
        id: baseId,
        eventType: 'feeding',
        type: feedType,
        amount: feedAmount,
        timestamp: now
      });
    }

    // Submit pee event if selected
    if (peeSelected) {
      eventsToSubmit.push({
        id: baseId + 1,
        eventType: 'peeing',
        timestamp: now
      });
    }

    // Submit poop event if selected
    if (poopSelected) {
      eventsToSubmit.push({
        id: baseId + 2,
        eventType: 'pooping',
        timestamp: now,
        consistency: notes.trim() || undefined
      });
    }

    // Notes are used for poop consistency if poop is selected
    // Otherwise notes are ignored (can be added to last event in future if needed)

    if (eventsToSubmit.length === 0) {
      // No events to submit
      return;
    }

    // Submit all events
    eventsToSubmit.forEach(event => {
      onSubmit(event);
    });

    // Reset form
    setFeedType(null);
    setFeedAmount(0);
    setPeeSelected(false);
    setPoopSelected(false);
    setNotes('');
    setShowFeedOptions(false);

    // Scroll to charts on mobile after a brief delay
    setTimeout(() => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile && chartsSectionRef.current) {
        chartsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const peeingConfig = config?.events?.find(e => e.id === 'peeing');
  const poopingConfig = config?.events?.find(e => e.id === 'pooping');

  return (
    <div className="mobile-event-input">
      {/* Feed Section */}
      <div className="event-input-section">
        <button
          type="button"
          className={`event-button feed-button ${feedType ? 'selected' : ''}`}
          onClick={handleFeedClick}
        >
          <span className="button-emoji">{feedingConfig?.emoji || '🍼'}</span>
          <span className="button-label">Feed</span>
          {feedType && (
            <span className="button-subtitle">
              {feedType === 'breastmilk' ? '🤱' : feedType === 'formula' ? '🥛' : '🍼'} {feedAmount}ml
            </span>
          )}
        </button>

        {showFeedOptions && (
          <div className="feed-options">
            <button
              type="button"
              className={`feed-option-button ${feedType === 'breastmilk' ? 'selected' : ''}`}
              onClick={() => handleFeedTypeSelect('breastmilk')}
            >
              <span className="option-emoji">🤱</span>
              <span className="option-label">Breast</span>
            </button>
            <button
              type="button"
              className={`feed-option-button ${feedType === 'bottle' ? 'selected' : ''}`}
              onClick={() => handleFeedTypeSelect('bottle')}
            >
              <span className="option-emoji">🍼</span>
              <span className="option-label">Breast Bottle</span>
            </button>
            <button
              type="button"
              className={`feed-option-button ${feedType === 'formula' ? 'selected' : ''}`}
              onClick={() => handleFeedTypeSelect('formula')}
            >
              <span className="option-emoji">🥛</span>
              <span className="option-label">Formula</span>
            </button>
          </div>
        )}

        {feedType && (
          <div className="amount-selector">
            <label htmlFor="feed-amount">Amount (ml): {feedAmount}</label>
            <div className="amount-slider-wrapper">
              <input
                ref={amountInputRef}
                id="feed-amount"
                type="range"
                min={sliderMin}
                max={sliderMax}
                step={sliderStep}
                value={feedAmount}
                onChange={handleAmountChange}
                className="amount-slider"
              />
              <div className="amount-slider-labels">
                <span>{sliderMin}ml</span>
                <span>{sliderMax}ml</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pee Section */}
      <div className="event-input-section">
        <button
          type="button"
          className={`event-button pee-button ${peeSelected ? 'selected' : ''}`}
          onClick={handlePeeToggle}
        >
          <span className="button-emoji">{peeingConfig?.emoji || '💧'}</span>
          <span className="button-label">Pee</span>
        </button>
      </div>

      {/* Poop Section */}
      <div className="event-input-section">
        <button
          type="button"
          className={`event-button poop-button ${poopSelected ? 'selected' : ''}`}
          onClick={handlePoopToggle}
        >
          <span className="button-emoji">{poopingConfig?.emoji || '💩'}</span>
          <span className="button-label">Poop</span>
        </button>
      </div>

      {/* Notes Section */}
      <div className="event-input-section">
        <label htmlFor="notes-input" className="notes-label">Notes</label>
        <textarea
          id="notes-input"
          className="notes-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes here..."
          rows="3"
        />
      </div>

      {/* Submit Button */}
      <div className="event-input-section">
        <button
          type="button"
          className="submit-button-large"
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

