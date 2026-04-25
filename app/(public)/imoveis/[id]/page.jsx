import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ContactForm from "@/app/components/ContactForm";
import PropertyCard from "@/app/components/PropertyCard";
import ImageGallery from '@/app/components/ImageGallery';
import prisma from "@/lib/prisma";
import "./property.css";
import "./suggestions.css";

// Helper function to fetch property from database
async function getProperty(id) {
  const dbProperty = await prisma.property.findUnique({
    where: { id },
    include: { images: { orderBy: { order: 'asc' } } }
  });

  if (!dbProperty) return null;

  return {
    ...dbProperty,
    type: dbProperty.category,
    area: dbProperty.usableArea || dbProperty.totalArea,
    location: `${dbProperty.neighborhood ? dbProperty.neighborhood + ', ' : ''}${dbProperty.city || ''} - ${dbProperty.state || ''}`,
    image: dbProperty.images?.[0]?.url || null,
    lat: dbProperty.latitude,
    lng: dbProperty.longitude,
  };
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    return {
      title: "Imóvel não encontrado | Consmel",
    };
  }

  return {
    title: `${property.title} | Consmel Imobiliária`,
    description: property.description,
  };
}

export default async function PropertyDetail({ params }) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    notFound();
  }

  // Fetch related properties
  const dbRelated = await prisma.property.findMany({
    where: {
      category: property.category,
      id: { not: id }
    },
    take: 3,
    include: { images: { orderBy: { order: 'asc' } } }
  });

  const relatedProperties = dbRelated.map(p => ({
    ...p,
    type: p.category,
    area: p.usableArea || p.totalArea,
    location: `${p.neighborhood ? p.neighborhood + ', ' : ''}${p.city || ''} - ${p.state || ''}`,
    image: p.images?.[0]?.url || null,
    lat: p.latitude,
    lng: p.longitude,
  }));

  const formatPrice = (price) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="property-page-wrapper">
      {/* Property Gallery (Contained) */}
      <section className="property-gallery-section" style={{ backgroundColor: 'white' }}>
        <div className="container gallery-container">
          <ImageGallery
            images={property.images && property.images.length > 0 ? property.images.map(img => img.url) : [property.image].filter(Boolean)}
            title={property.title}
            roomLabels={property.category === 'Terreno' ? ['Frente do Terreno', 'Rua', 'Bairro', 'Visão Geral', 'Detalhe'] : ['Fachada', 'Sala', 'Quarto', 'Cozinha', 'Banheiro', 'Garagem']}
          />
        </div>
      </section>

      {/* Header: Title & Price */}
      <section className="property-header-section">
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '400',
            color: '#333',
            marginBottom: '4px',
            lineHeight: '1.3'
          }}>
            {property.transactionType === 'Aluguel'
              ? `${property.type} para Locação no ${property.location.split(',')[0]}`
              : `${property.type} à Venda no ${property.location.split(',')[0]}`}
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#888',
            marginBottom: '8px'
          }}>
            {property.city ? `${property.city} - ${property.state || 'SP'}` : property.location}
          </p>
          <div style={{
            fontSize: '1.6rem',
            color: '#333',
            fontWeight: '400'
          }}>
            {formatPrice(property.price)}
          </div>
        </div>
      </section>

      {/* Videos Section — só renderiza se a property tem vídeos */}
      {property.videos && property.videos.length > 0 && (
        <section className="property-videos-section" style={{ padding: '32px 0', backgroundColor: 'white' }}>
          <div className="container">
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '20px',
              color: '#333',
              textAlign: 'center'
            }}>
              {property.videos.length > 1 ? 'Vídeos do Imóvel' : 'Vídeo do Imóvel'}
            </h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              maxWidth: '900px',
              margin: '0 auto'
            }}>
              {property.videos.map((url, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16 / 9',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#000',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                  }}
                >
                  <video
                    src={url}
                    controls
                    playsInline
                    preload="metadata"
                    poster={property.image || undefined}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  >
                    Seu navegador não suporta a tag de vídeo.
                  </video>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content: Details + Sidebar */}
      <section style={{ padding: '24px 0', backgroundColor: '#f9f9f9' }}>
        <div className="container">
          <div className="property-page-layout">

            {/* LEFT COLUMN */}
            <div className="property-main-content">

              {/* Details Card */}
              <div className="details-card" style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #eee'
                }}>
                  Detalhes
                </h3>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px 24px',
                  fontSize: '0.875rem',
                  color: '#333'
                }}>
                  {property.bedrooms ? <div><strong>Dormitórios:</strong> {property.bedrooms}</div> : null}
                  {property.suites ? <div><strong>Suítes:</strong> {property.suites}</div> : null}
                  {property.bathrooms ? <div><strong>Banheiros:</strong> {property.bathrooms}</div> : null}
                  {property.parkingSpaces ? <div><strong>Vagas:</strong> {property.parkingSpaces}</div> : null}
                  {property.usableArea ? <div><strong>Área Construída (em M²):</strong> {property.usableArea}m²</div> : null}
                  {property.totalArea ? <div><strong>Terreno (em M²):</strong> {property.totalArea}m²</div> : null}

                  {property.features && property.features.map((feature, index) => (
                    <div key={index}><strong>{feature}:</strong> Sim</div>
                  ))}
                </div>
              </div>

              {/* Value Prop Card */}
              <div className="value-prop-card">
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  marginBottom: '12px'
                }}>
                  Porque comprar na Consmel?
                </h3>
                <p style={{
                  fontStyle: 'italic',
                  color: '#666',
                  fontSize: '0.875rem',
                  lineHeight: '1.6'
                }}>
                  &quot;Essa é fácil de responder! Transparência e honestidade sempre foram as palavras chave. Estamos há 46 anos no mercado imobiliário realizando o sonho de morar bem!&quot;
                </p>
              </div>

            </div>

            {/* RIGHT COLUMN: Form */}
            <div className="property-sidebar-wrapper">
              <div className="property-sidebar-sticky">
                <ContactForm propertyTitle={property.title} />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Suggestions Section */}
      <section style={{ padding: '48px 0', backgroundColor: 'white' }}>
        <div className="container">
          <h2 style={{ fontSize: '1.5rem', fontWeight: '400', marginBottom: '24px', color: '#333' }}>
            Sugestões com base nesse imóvel
          </h2>

          {(!relatedProperties || relatedProperties.length === 0) ? (
            <p style={{ color: '#666', fontSize: '0.95rem' }}>
              Nenhuma sugestão foi encontrada para este tipo de imóvel.
            </p>
          ) : (
            <div className="suggestions-grid">
              {relatedProperties.map(prop => (
                <div key={prop.id} className="suggestion-wrapper">
                  <PropertyCard property={prop} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
