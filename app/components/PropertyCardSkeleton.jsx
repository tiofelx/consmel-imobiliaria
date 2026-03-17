import React from 'react';
import './PropertyCard.css';

export default function PropertyCardSkeleton() {
  return (
    <div className="property-card" style={{ animation: 'pulse 1.5s infinite ease-in-out', pointerEvents: 'none' }}>
      <div className="property-card-image-container" style={{ backgroundColor: '#e2e8f0', height: '240px' }}>
      </div>

      <div className="property-card-body" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          height: '24px',
          width: '80px',
          backgroundColor: '#e2e8f0',
          borderRadius: '4px',
          marginBottom: '8px'
        }}></div>

        <div style={{ height: '28px', width: '80%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '4px' }}></div>
        <div style={{ height: '28px', width: '60%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '16px' }}></div>

        <div style={{ height: '16px', width: '40%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '16px' }}></div>

        <div className="property-card-features" style={{ justifyContent: 'center', opacity: 0.5 }}>
           <div style={{ height: '20px', width: '50px', backgroundColor: '#e2e8f0', borderRadius: '4px' }}></div>
           <div style={{ height: '20px', width: '50px', backgroundColor: '#e2e8f0', borderRadius: '4px' }}></div>
        </div>

        <div style={{ height: '32px', width: '120px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginTop: '16px' }}></div>
      </div>
    </div>
  );
}
