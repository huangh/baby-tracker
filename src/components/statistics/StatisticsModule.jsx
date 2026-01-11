import React from 'react';
import { calculateStatistics } from '../../utils/statisticsCalculator';

/**
 * StatisticsModule Component
 * Displays statistics about events (extensible structure)
 */
export default function StatisticsModule({ events }) {
  const stats = calculateStatistics(events || []);
  
  return (
    <div className="statistics-module">
      <h3>Statistics</h3>
      <div className="statistics-content">
        <div className="stat-item">
          <span className="stat-label">Avg Time Between Feeds:</span>
          <span className="stat-value">{stats.averageTimeBetweenFeeds.formatted}</span>
        </div>
        {/* Add more statistics here as needed */}
      </div>
    </div>
  );
}

