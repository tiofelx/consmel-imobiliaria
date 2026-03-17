import Link from 'next/link';
import Image from 'next/image';
import './PropertyCard.css';

export default function PropertyCard({ property }) {
  const {
    id,
    title,
    price,
    location,
    type,
    bedrooms,
    bathrooms,
    area,
    image,
    transactionType
  } = property;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <Link href={`/imoveis/${id}`} className="property-card">
      <div className="property-card-image-container">
        <span className="property-card-badge">{transactionType}</span>
        <Image
          src={image || '/placeholder-property.jpg'}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="property-card-image"
        />
        <div className="property-card-overlay">
          <span className="view-details">Ver Detalhes</span>
        </div>

        {/* Watermark Overlay */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '85%',
          height: 'auto',
          aspectRatio: '1/1',
          zIndex: 20,
          opacity: 0.65,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Image
            src="/watermark.png"
            alt="Watermark"
            width={400}
            height={400}
            unoptimized
            style={{
              width: '100%',
              height: 'auto',
              objectFit: 'contain'
            }}
          />
        </div>
      </div>

      <div className="property-card-body" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span className="property-card-type" style={{
          display: 'inline-block',
          marginBottom: '8px',
          backgroundColor: '#FFF0E6',
          color: 'var(--color-primary)',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          width: 'auto',
          minWidth: '80px'
        }}>{type}</span>

        <h3 className="property-card-title" style={{ marginBottom: '4px' }}>
          {title}
        </h3>

        <p className="property-card-location" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '16px', fontSize: '0.85rem', color: '#666' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          {location}
        </p>

        <div className="property-card-features">
          {bedrooms && (
            <span className="feature">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V7H1v10h2v-2h18v2h2v-7c0-2.21-1.79-4-4-4z" />
              </svg>
              {bedrooms} {bedrooms === 1 ? 'quarto' : 'quartos'}
            </span>
          )}
          {bathrooms && (
            <span className="feature">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 2v1H3a1 1 0 00-1 1v16a1 1 0 001 1h18a1 1 0 001-1V4a1 1 0 00-1-1h-6V2h-2v1h-2V2H9zm11 17H4V5h16v14z" />
                <circle cx="7" cy="9" r="1.5" />
              </svg>
              {bathrooms} {bathrooms === 1 ? 'banheiro' : 'banheiros'}
            </span>
          )}
          {area && (
            <span className="feature">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 20H4v-4h4v4zm0-6H4v-4h4v4zm0-6H4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4z" />
              </svg>
              {area}m²
            </span>
          )}
        </div>

        <div className="property-card-price">{formatPrice(price)}</div>
      </div>
    </Link>
  );
}
