'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
// import Image from 'next/image'; // Kept commented out just in case
// import MagmaBackground from '../components/MagmaBackground';
import HouseShadowBackground from '../components/HouseShadowBackground';
import PropertyCard from '../components/PropertyCard';
import PropertyCardSkeleton from '../components/PropertyCardSkeleton';
import SectionBanner from '../components/SectionBanner';
import SmartSearchFilter from '../components/SmartSearchFilter';

import { searchProperties } from '@/lib/properties';
import './page.css';

// Matches the gradient top color in HouseShadowBackground so there is
// zero contrast between first paint and CSS-loaded state — no flash.
const heroFallbackColor = '#1e3a5f';

export default function Home() {
  // State for properties and loading
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch properties from API
  useEffect(() => {
    async function fetchProperties() {
      try {
        const res = await fetch('/api/properties');
        if (res.ok) {
          const data = await res.json();
          setProperties(data);
        }
      } catch (error) {
        console.error('Failed to fetch properties:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProperties();
  }, []);

  // activeFilters state
  const [activeFilters, setActiveFilters] = useState({
    transactionType: '',
    propertyType: '',
    city: '',
    neighborhood: '',
    priceRange: ''
  });

  // Handle filter changes
  const handleFilterChange = useCallback((filters) => {
    setActiveFilters(filters);
  }, []);

  // Apply filters
  const filteredProperties = useMemo(() => {
    if (!activeFilters.transactionType && !activeFilters.propertyType &&
      !activeFilters.city && !activeFilters.neighborhood && !activeFilters.priceRange) {
      return properties;
    }
    // Pass properties state to searchProperties
    return searchProperties(properties, activeFilters);
  }, [activeFilters, properties]);

  // Featured properties
  const featuredProperties = useMemo(() => {
    return filteredProperties.slice(0, 6);
  }, [filteredProperties]);

  // Rental properties
  const rentalProperties = useMemo(() => {
    const rentalFilters = { ...activeFilters, transactionType: 'aluguel' };
    return searchProperties(properties, rentalFilters).slice(0, 6);
  }, [activeFilters, properties]);

  // Sale properties
  const saleProperties = useMemo(() => {
    const saleFilters = { ...activeFilters, transactionType: 'venda' };
    return searchProperties(properties, saleFilters).slice(0, 6);
  }, [activeFilters, properties]);

  return (
    <>
      {/* Hero Section */}
      <section
        className="hero"
        style={{
          minHeight: '100svh',
          backgroundColor: '#1e3a5f',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          className="hero-background"
          style={{
            backgroundColor: heroFallbackColor,
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 0
          }}
        >
          <HouseShadowBackground />
          <div
            className="hero-overlay"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              background: 'rgba(30, 58, 95, 0.4)',
              zIndex: 1,
              pointerEvents: 'none'
            }}
          ></div>
        </div>
        <div className="container hero-content">
          {/* Hero text removed as requested */}

          {/* Advanced Search Filter */}
          <div className="hero-search animate-search-filter-entrance">
            <SmartSearchFilter onFilterChange={handleFilterChange} properties={filteredProperties} />
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="featured-properties section bg-secondary">
        <div className="container">
          <div className="section-header">
            <h2>Imóveis em Destaque</h2>
            <p>Confira nossa seleção de imóveis com as melhores oportunidades</p>
          </div>

          <div className="properties-grid">
            {isLoading ? (
              // Add skeleton loader placeholders to maintain height for CLS prevention
              Array.from({ length: 6 }).map((_, idx) => (
                <PropertyCardSkeleton key={idx} />
              ))
            ) : featuredProperties.length > 0 ? (
              featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))
            ) : (
                <p className="col-span-full text-center text-gray-500 py-8">Nenhum imóvel encontrado.</p>
            )}
          </div>

          <div className="text-center" style={{ marginTop: 'var(--space-12)' }}>
            <Link href="/imoveis" className="btn btn-primary btn-lg">
              Ver Todos os Imóveis
            </Link>
          </div>
        </div>
      </section>

      {/* Rental Properties */}
      <SectionBanner
        title="Imóveis para Alugar"
        backgroundImage="/images/recepcao.png"
        buttonText="Ver Todos"
        buttonLink="/imoveis?tipo=aluguel"
      />
      <section className="featured-properties section" style={{ paddingTop: 'var(--space-8)' }}>
        <div className="container">

          <div className="properties-grid">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <PropertyCardSkeleton key={idx} />
              ))
            ) : rentalProperties.length > 0 ? (
              rentalProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))
            ) : (
                <p className="col-span-full text-center text-gray-500 py-8">Nenhum imóvel encontrado.</p>
            )}
          </div>

          <div className="text-center" style={{ marginTop: 'var(--space-12)' }}>
            <Link href="/imoveis?tipo=aluguel" className="btn btn-primary btn-lg">
              Ver Todos os Imóveis para Alugar
            </Link>
          </div>
        </div>
      </section>

      {/* Sale Properties */}
      <SectionBanner
        title="Imóveis para Comprar"
        backgroundImage="/images/recepcao-2.png"
        buttonText="Ver Todos"
        buttonLink="/imoveis?tipo=venda"
      />
      <section className="featured-properties section bg-secondary" style={{ paddingTop: 'var(--space-8)' }}>
        <div className="container">

          <div className="properties-grid">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <PropertyCardSkeleton key={idx} />
              ))
            ) : saleProperties.length > 0 ? (
              saleProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))
            ) : (
                 <p className="col-span-full text-center text-gray-500 py-8">Nenhum imóvel encontrado.</p>
            )}
          </div>

          <div className="text-center" style={{ marginTop: 'var(--space-12)' }}>
            <Link href="/imoveis?tipo=venda" className="btn btn-primary btn-lg">
              Ver Todos os Imóveis Ã  Venda
            </Link>
          </div>
        </div>
      </section>
      {/* Why Choose Us */}
      <section className="why-choose section bg-secondary">
        <div className="container">
          <div className="section-header">
            <h2>Por que escolher a Consmel?</h2>
            <p>Diferenciais que fazem toda a diferença</p>
          </div>

          <div className="grid grid-cols-1 grid-cols-md-2 grid-cols-lg-4">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3>Segurança</h3>
              <p>Documentação verificada e processo 100% seguro</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h3>Agilidade</h3>
              <p>Atendimento rápido e processos otimizados</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h3>Atendimento Personalizado</h3>
              <p>Consultores dedicados às suas necessidades</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <h3>Qualidade</h3>
              <p>Imóveis selecionados com critério e cuidado</p>
            </div>
          </div>
        </div>
      </section>


    </>
  );
}


