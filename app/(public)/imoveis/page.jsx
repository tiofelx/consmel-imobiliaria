import Link from 'next/link';
import PropertyCard from '@/app/components/PropertyCard';
import prisma from '@/lib/prisma';
import './imoveis.css';

export const metadata = {
  title: 'Imóveis | Consmel Imobiliária',
  description: 'Confira todos os imóveis disponíveis para compra e locação. Casas, apartamentos, terrenos e muito mais.',
};

export default async function Imoveis({ searchParams }) {
  const params = await searchParams;
  const tipo = params?.tipo?.toLowerCase();

  // Optimized Database Query
  const dbProperties = await prisma.property.findMany({
    where: tipo ? {
      transactionType: {
        equals: tipo,
        mode: 'insensitive'
      }
    } : {},
    include: {
      images: {
        orderBy: { order: 'asc' },
        take: 1 // Only need the first image for the card
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  const properties = dbProperties.map(p => ({
    ...p,
    type: p.category,
    area: p.usableArea || p.totalArea,
    location: `${p.neighborhood ? p.neighborhood + ', ' : ''}${p.city || ''} - ${p.state || ''}`,
    image: p.images?.[0]?.url || null,
    lat: p.latitude,
    lng: p.longitude,
  }));

  const filtered = properties; // Already filtered by DB

  // Determine Hero Class based on filter
  const getHeroClass = () => {
    const tipo = params?.tipo?.toLowerCase();
    if (tipo === 'venda') return 'hero-venda';
    if (tipo === 'aluguel') return 'hero-aluguel';
    return 'hero-todos';
  };

  return (
    <>
      {/* Hero Section */}
      <section className={`page-hero-dynamic ${getHeroClass()}`}>
        <div className="container">
          <h1 className="animate-slide-in-up">Nossos Imóveis</h1>
          <p className="hero-description animate-slide-in-up">
            {params?.tipo
              ? `Imóveis para ${params.tipo}`
              : 'Encontre o imóvel perfeito para você'
            }
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="filters-section section-sm">
        <div className="container">
          <div className="filters-bar">
            <Link
              href="/imoveis"
              className={`filter-btn ${!params?.tipo ? 'active' : ''}`}
            >
              Todos
            </Link>
            <Link
              href="/imoveis?tipo=venda"
              className={`filter-btn ${params?.tipo === 'venda' ? 'active' : ''}`}
            >
              Venda
            </Link>
            <Link
              href="/imoveis?tipo=aluguel"
              className={`filter-btn ${params?.tipo === 'aluguel' ? 'active' : ''}`}
            >
              Aluguel
            </Link>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="section">
        <div className="container">
          <div className="results-header">
            <p className="results-count">
              {filtered.length} {filtered.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
            </p>
          </div>

          {filtered.length > 0 ? (
            <div className="properties-grid animate-page-entrance">
              {filtered.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="no-results animate-page-entrance">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <h3>Nenhum imóvel encontrado</h3>
              <p>Tente ajustar os filtros ou volte mais tarde para ver novos imóveis.</p>
              <Link href="/imoveis" className="btn btn-primary" style={{ marginTop: 'var(--space-6)' }}>
                Ver Todos os Imóveis
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
