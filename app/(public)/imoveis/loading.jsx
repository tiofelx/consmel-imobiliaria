import PropertyCardSkeleton from '@/app/components/PropertyCardSkeleton';

export default function Loading() {
  return (
    <>
      {/* Hero Section Skeleton */}
      <section className="page-hero-dynamic hero-todos">
        <div className="container">
          <div style={{
            height: '48px',
            width: '300px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '8px',
            marginBottom: '16px',
            animation: 'pulse 1.5s infinite'
          }}></div>
          <div style={{
            height: '24px',
            width: '450px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
            animation: 'pulse 1.5s infinite'
          }}></div>
        </div>
      </section>

      {/* Filters Section Skeleton */}
      <section className="filters-section section-sm">
        <div className="container">
          <div className="filters-bar" style={{ opacity: 0.5 }}>
            <div style={{ height: '40px', width: '80px', backgroundColor: '#e2e8f0', borderRadius: '20px' }}></div>
            <div style={{ height: '40px', width: '80px', backgroundColor: '#e2e8f0', borderRadius: '20px' }}></div>
            <div style={{ height: '40px', width: '80px', backgroundColor: '#e2e8f0', borderRadius: '20px' }}></div>
          </div>
        </div>
      </section>

      {/* Properties Grid Skeleton */}
      <section className="section">
        <div className="container">
          <div className="results-header">
            <div style={{ height: '24px', width: '150px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}></div>
          </div>

          <div className="properties-grid">
            {[...Array(6)].map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}} />
    </>
  );
}
