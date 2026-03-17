import React from 'react';
import './StaticSearchForm.css';

export default function StaticSearchForm() {
  return (
    <div className="smart-search-container">
      <div className="smart-search-header">
        <h3 className="smart-search-title">Buscar imóveis</h3>
        <button type="button" className="map-toggle-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <map name=""></map>
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
            </svg>
            Ver no Mapa
        </button>
      </div>

      <div className="smart-search-content">
        <form className="smart-search-form">
          <div className="transaction-buttons">
            <button type="button" className="transaction-btn active">
              Aluguel
            </button>
            <button type="button" className="transaction-btn">
              Venda
            </button>
          </div>

          <div className="filter-field">
            <label htmlFor="static-prop-type">Tipo</label>
            <select id="static-prop-type" disabled>
              <option>Selecione...</option>
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="static-city">Cidade</label>
            <select id="static-city" disabled>
              <option>Selecione...</option>
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="static-neighborhood">Bairro</label>
            <select id="static-neighborhood" disabled>
              <option>Selecione...</option>
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="static-price">Valor</label>
            <select id="static-price" disabled>
              <option>Selecione...</option>
            </select>
          </div>

          <button type="button" className="btn-search-submit" disabled>
            Pesquisar
          </button>
        </form>
        
        {/* Hidden Map Container placeholder */}
        <div className="smart-search-map"></div>
      </div>
    </div>
  );
}
