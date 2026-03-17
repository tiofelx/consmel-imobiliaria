'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './page.css';
export default function AdminProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/properties', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setProperties(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este imóvel?')) return;

    const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setProperties(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <>
      <div className="admin-section-header">
        <div className="admin-header-content">
          <h2>Gerenciar Imóveis</h2>
          <p>Visualize e gerencie todos os imóveis cadastrados.</p>
        </div>
        <Link href="/admin/imoveis/novo" className="btn-header-action">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Novo Imóvel
        </Link>
      </div>

      <div className="admin-table-container">
        <table>
          <thead>
            <tr>
              <th>Informações do Imóvel</th>
              <th>Tipo / Categoria</th>
              <th>Preço</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Carregando...</td></tr>
            ) : properties.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Nenhum imóvel cadastrado ainda.</td></tr>
            ) : (
              properties.map(property => (
                <tr key={property.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{property.title}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '2px' }}>
                      {[property.neighborhood, property.city].filter(Boolean).join(', ') || '—'}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                      {[
                        property.bedrooms ? `${property.bedrooms} Quartos` : null,
                        property.bathrooms ? `${property.bathrooms} Banheiros` : null,
                        property.usableArea ? `${property.usableArea}m²` : null
                      ].filter(Boolean).join(' • ')}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{property.category}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      {property.transactionType}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: '#f97316' }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.price)}
                  </td>
                  <td>
                    <span className="status-badge status-active">
                      Ativo
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/admin/imoveis/${property.id}`} className="action-btn" title="Editar" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </Link>
                    <button className="action-btn" title="Excluir" style={{ color: '#ef4444' }} onClick={() => handleDelete(property.id)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
