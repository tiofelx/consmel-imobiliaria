import React from 'react';
import './SearchFilterSkeleton.css';

export default function SearchFilterSkeleton() {
  return (
    <div className="smart-search-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-title"></div>
        <div className="skeleton-toggle"></div>
      </div>
      
      <div className="skeleton-content">
        <div className="skeleton-tabs">
          <div className="skeleton-tab"></div>
          <div className="skeleton-tab"></div>
        </div>

        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-field">
            <div className="skeleton-label"></div>
            <div className="skeleton-input"></div>
          </div>
        ))}

        <div className="skeleton-button"></div>
      </div>
    </div>
  );
}
