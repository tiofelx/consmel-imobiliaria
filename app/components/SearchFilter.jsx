'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './SearchFilter.css';

export default function SearchFilter({ onFilterChange }) {
  const router = useRouter();
  const [filters, setFilters] = useState({
    transactionType: 'aluguel',
    propertyType: '',
    city: '',
    neighborhood: '',
    priceRange: ''
  });

  // Define price ranges based on transaction type
  const rentalPriceRanges = [
    { value: '', label: 'Selecione...' },
    { value: '0-500', label: 'até R$ 500' },
    { value: '500-1000', label: 'de R$ 500 a R$ 1.000' },
    { value: '1000-1500', label: 'de R$ 1.000 a R$ 1.500' },
    { value: '1500-2000', label: 'de R$ 1.500 a R$ 2.000' },
    { value: '2000-3000', label: 'de R$ 2.000 a R$ 3.000' },
    { value: '3000-5000', label: 'de R$ 3.000 a R$ 5.000' },
    { value: '5000-10000', label: 'de R$ 5.000 a R$ 10.000' },
    { value: '10000-999999', label: 'acima de R$ 10.000' }
  ];

  const salePriceRanges = [
    { value: '', label: 'Selecione...' },
    { value: '0-50000', label: 'até R$ 50.000' },
    { value: '50000-100000', label: 'de R$ 50.000 a R$ 100.000' },
    { value: '100000-150000', label: 'de R$ 100.000 a R$ 150.000' },
    { value: '150000-200000', label: 'de R$ 150.000 a R$ 200.000' },
    { value: '200000-250000', label: 'de R$ 200.000 a R$ 250.000' },
    { value: '250000-300000', label: 'de R$ 250.000 a R$ 300.000' },
    { value: '300000-500000', label: 'de R$ 300.000 a R$ 500.000' },
    { value: '500000-99999999', label: 'acima de R$ 500.000' }
  ];

  // Get current price ranges based on transaction type
  const currentPriceRanges = filters.transactionType === 'aluguel'
    ? rentalPriceRanges
    : salePriceRanges;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFilters = {
      ...filters,
      [name]: value
    };
    setFilters(newFilters);

    // Notify parent of changes
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleTransactionChange = (type) => {
    const newFilters = {
      ...filters,
      transactionType: type,
      priceRange: '' // Reset price range when changing transaction type
    };
    setFilters(newFilters);

    // Notify parent of changes
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Build query string
    const params = new URLSearchParams();

    if (filters.transactionType) params.append('tipo', filters.transactionType);
    if (filters.propertyType) params.append('tipoImovel', filters.propertyType);
    if (filters.city) params.append('cidade', filters.city);
    if (filters.neighborhood) params.append('bairro', filters.neighborhood);
    if (filters.priceRange) params.append('preco', filters.priceRange);

    // Navigate to properties page with filters
    router.push(`/imoveis?${params.toString()}`);
  };

  return (
    <div className="search-filter-card">
      <h3 className="search-filter-title">Buscar por Código</h3>

      <form onSubmit={handleSubmit} className="search-filter-form">
        {/* Transaction Type - Large Buttons */}
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

        {/* Property Type */}
        <div className="filter-field">
          <label htmlFor="propertyType">Tipo</label>
          <select
            id="propertyType"
            name="propertyType"
            value={filters.propertyType}
            onChange={handleChange}
          >
            <option value="">Selecione...</option>
            <option value="casa">Casa</option>
            <option value="apartamento">Apartamento</option>
            <option value="terreno">Terreno</option>
            <option value="comercial">Comercial</option>
            <option value="chacara">Chácara</option>
          </select>
        </div>

        {/* City */}
        <div className="filter-field">
          <label htmlFor="city">Cidade</label>
          <select
            id="city"
            name="city"
            value={filters.city}
            onChange={handleChange}
          >
            <option value="">Selecione...</option>
            <option value="sao-paulo">São Paulo - SP</option>
            <option value="barueri">Barueri - SP</option>
            <option value="osasco">Osasco - SP</option>
            <option value="guarulhos">Guarulhos - SP</option>
            <option value="santo-andre">Santo André - SP</option>
          </select>
        </div>

        {/* Neighborhood */}
        <div className="filter-field">
          <label htmlFor="neighborhood">Bairro</label>
          <select
            id="neighborhood"
            name="neighborhood"
            value={filters.neighborhood}
            onChange={handleChange}
          >
            <option value="">Selecione...</option>
            <option value="jardim-paulista">Jardim Paulista</option>
            <option value="moema">Moema</option>
            <option value="vila-mariana">Vila Mariana</option>
            <option value="pinheiros">Pinheiros</option>
            <option value="itaim-bibi">Itaim Bibi</option>
            <option value="morumbi">Morumbi</option>
            <option value="alphaville">Alphaville</option>
          </select>
        </div>

        {/* Price Range - Dynamic based on transaction type */}
        <div className="filter-field">
          <label htmlFor="priceRange">Valor</label>
          <select
            id="priceRange"
            name="priceRange"
            value={filters.priceRange}
            onChange={handleChange}
          >
            {currentPriceRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button type="submit" className="btn-search-submit">
          Pesquisar
        </button>
      </form>
    </div>
  );
}
