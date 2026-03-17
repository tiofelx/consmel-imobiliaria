'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './SmartSearchFilter.css';

const SmartSearchLeafletMap = dynamic(() => import('./SmartSearchLeafletMap'), {
  ssr: false,
});

const DEFAULT_LOCATION = {
  center: [-20.5065555, -48.9160555],
  zoom: 13,
};

const LOCATIONS_MAP = {
  guaraci: { center: [-20.5065555, -48.9160555], zoom: 13 },
  'sao-paulo': { center: [-23.55052, -46.633309], zoom: 11 },
  barueri: { center: [-23.511192, -46.876465], zoom: 12 },
  osasco: { center: [-23.532321, -46.791696], zoom: 12 },
  guarulhos: { center: [-23.462788, -46.533358], zoom: 12 },
  'santo-andre': { center: [-23.6693, -46.537955], zoom: 12 },
  'curva-da-galinha': { center: [-20.5065555, -48.9160555], zoom: 15 },
  'jardim-paulista': { center: [-23.571434, -46.657805], zoom: 15 },
  moema: { center: [-23.602521, -46.661726], zoom: 15 },
  'vila-mariana': { center: [-23.585579, -46.634674], zoom: 15 },
  pinheiros: { center: [-23.565457, -46.696803], zoom: 15 },
  'itaim-bibi': { center: [-23.584102, -46.680002], zoom: 15 },
  morumbi: { center: [-23.59795, -46.711818], zoom: 14 },
  alphaville: { center: [-23.496528, -46.850401], zoom: 14 },
};

const RENTAL_PRICE_RANGES = [
  { value: '', label: 'Selecione...' },
  { value: '0-500', label: 'ate R$ 500' },
  { value: '500-1000', label: 'de R$ 500 a R$ 1.000' },
  { value: '1000-1500', label: 'de R$ 1.000 a R$ 1.500' },
  { value: '1500-2000', label: 'de R$ 1.500 a R$ 2.000' },
  { value: '2000-3000', label: 'de R$ 2.000 a R$ 3.000' },
  { value: '3000-5000', label: 'de R$ 3.000 a R$ 5.000' },
  { value: '5000-10000', label: 'de R$ 5.000 a R$ 10.000' },
  { value: '10000-999999', label: 'acima de R$ 10.000' },
];

const SALE_PRICE_RANGES = [
  { value: '', label: 'Selecione...' },
  { value: '0-50000', label: 'ate R$ 50.000' },
  { value: '50000-100000', label: 'de R$ 50.000 a R$ 100.000' },
  { value: '100000-150000', label: 'de R$ 100.000 a R$ 150.000' },
  { value: '150000-200000', label: 'de R$ 150.000 a R$ 200.000' },
  { value: '200000-250000', label: 'de R$ 200.000 a R$ 250.000' },
  { value: '250000-300000', label: 'de R$ 250.000 a R$ 300.000' },
  { value: '300000-500000', label: 'de R$ 300.000 a R$ 500.000' },
  { value: '500000-99999999', label: 'acima de R$ 500.000' },
];

export default function SmartSearchFilter({ onFilterChange, properties = [] }) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [mapView, setMapView] = useState(DEFAULT_LOCATION);
  const [filters, setFilters] = useState({
    transactionType: 'aluguel',
    propertyType: '',
    city: '',
    neighborhood: '',
    priceRange: '',
  });

  const currentPriceRanges = filters.transactionType === 'aluguel' ? RENTAL_PRICE_RANGES : SALE_PRICE_RANGES;

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextFilters = { ...filters, [name]: value };

    if (name === 'city' && value) {
      nextFilters.neighborhood = '';
    }

    const nextView = LOCATIONS_MAP[nextFilters.neighborhood] || LOCATIONS_MAP[nextFilters.city] || DEFAULT_LOCATION;
    setMapView(nextView);

    if ((name === 'city' || name === 'neighborhood') && value) {
      setIsExpanded(true);
    }

    setFilters(nextFilters);
    if (onFilterChange) {
      onFilterChange(nextFilters);
    }
  };

  const handleTransactionChange = (type) => {
    const nextFilters = {
      ...filters,
      transactionType: type,
      priceRange: '',
    };

    setFilters(nextFilters);
    if (onFilterChange) {
      onFilterChange(nextFilters);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();

    if (filters.transactionType) params.append('tipo', filters.transactionType);
    if (filters.propertyType) params.append('tipoImovel', filters.propertyType);
    if (filters.city) params.append('cidade', filters.city);
    if (filters.neighborhood) params.append('bairro', filters.neighborhood);
    if (filters.priceRange) params.append('preco', filters.priceRange);

    router.push(`/imoveis?${params.toString()}`);
  };

  return (
    <div className={`smart-search-container ${isExpanded ? 'expanded' : ''}`}>
      <div className="smart-search-header">
        <h3 className="smart-search-title">Buscar imoveis</h3>
        <button type="button" className="map-toggle-btn" onClick={() => setIsExpanded((current) => !current)}>
          {isExpanded ? 'Fechar mapa' : 'Ver no mapa'}
        </button>
      </div>

      <div className="smart-search-content">
        <form onSubmit={handleSubmit} className="smart-search-form">
          <div className="transaction-buttons">
            <button
              type="button"
              className={`transaction-btn ${filters.transactionType === 'aluguel' ? 'active' : ''}`}
              onClick={() => handleTransactionChange('aluguel')}
            >
              Aluguel
            </button>
            <button
              type="button"
              className={`transaction-btn ${filters.transactionType === 'venda' ? 'active' : ''}`}
              onClick={() => handleTransactionChange('venda')}
            >
              Venda
            </button>
          </div>

          <div className="filter-field">
            <label htmlFor="smart-property-type">Tipo</label>
            <select id="smart-property-type" name="propertyType" value={filters.propertyType} onChange={handleChange}>
              <option value="">Selecione...</option>
              <option value="casa">Casa</option>
              <option value="apartamento">Apartamento</option>
              <option value="terreno">Terreno</option>
              <option value="comercial">Comercial</option>
              <option value="chacara">Chacara</option>
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="smart-city">Cidade</label>
            <select id="smart-city" name="city" value={filters.city} onChange={handleChange}>
              <option value="">Selecione...</option>
              <option value="guaraci">Guaraci - SP</option>
              <option value="sao-paulo">Sao Paulo - SP</option>
              <option value="barueri">Barueri - SP</option>
              <option value="osasco">Osasco - SP</option>
              <option value="guarulhos">Guarulhos - SP</option>
              <option value="santo-andre">Santo Andre - SP</option>
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="smart-neighborhood">Bairro</label>
            <select id="smart-neighborhood" name="neighborhood" value={filters.neighborhood} onChange={handleChange}>
              <option value="">Selecione...</option>
              <option value="curva-da-galinha">Curva da Galinha</option>
              <option value="jardim-paulista">Jardim Paulista</option>
              <option value="moema">Moema</option>
              <option value="vila-mariana">Vila Mariana</option>
              <option value="pinheiros">Pinheiros</option>
              <option value="itaim-bibi">Itaim Bibi</option>
              <option value="morumbi">Morumbi</option>
              <option value="alphaville">Alphaville</option>
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="smart-price-range">Valor</label>
            <select id="smart-price-range" name="priceRange" value={filters.priceRange} onChange={handleChange}>
              {currentPriceRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-search-submit">
            Pesquisar
          </button>
        </form>

        <div className={`smart-search-map ${isExpanded ? 'visible' : ''}`}>
          <SmartSearchLeafletMap center={mapView.center} zoom={mapView.zoom} isExpanded={isExpanded} properties={properties} />
        </div>
      </div>
    </div>
  );
}
