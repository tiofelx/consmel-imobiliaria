'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ServiceAPI } from '@/lib/api';
import '../services.css';

export default function ExtratoPage() {
  const [formData, setFormData] = useState({
    docType: 'cpf',
    document: '',
    id: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setResult(null);

    try {
      const response = await ServiceAPI.getExtrato(formData.document, formData.id);
      setResult(response.data);
      setMessage({ type: 'success', text: response.message });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Erro ao buscar extrato.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="service-page">
      <div className="service-card animate-page-entrance" style={result ? { maxWidth: '800px' } : {}}>
        <div className="service-header">
          <Link href="/servicos" className="service-back-link">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v18h-6M10 17l5-5-5-5M13.8 12H3" />
            </svg>
          </Link>
          <h1 className="service-title">Extrato do Proprietário</h1>
        </div>

        {!result ? (
          <form className="service-form" onSubmit={handleSubmit}>
            <div className="form-group-radio">
              <label className="radio-label">
                <input 
                  type="radio" 
                  name="docType" 
                  className="radio-input"
                  checked={formData.docType === 'cpf'}
                  onChange={() => setFormData({...formData, docType: 'cpf'})}
                />
                CPF
              </label>
              <label className="radio-label">
                <input 
                  type="radio" 
                  name="docType" 
                  className="radio-input"
                  checked={formData.docType === 'cnpj'}
                  onChange={() => setFormData({...formData, docType: 'cnpj'})}
                />
                CNPJ
              </label>
            </div>

            <div>
              <input
                type="text"
                className="form-input-service"
                placeholder={formData.docType === 'cpf' ? "CPF (apenas números)" : "CNPJ (apenas números)"}
                value={formData.document}
                onChange={(e) => setFormData({...formData, document: e.target.value})}
                required
              />
            </div>

            <div style={{ marginTop: '16px' }}>
              <label className="input-label" style={{ fontWeight: 'normal', color: '#666' }}>ID do Imóvel:</label>
              <input
                type="text"
                className="form-input-service"
                placeholder="ID"
                value={formData.id}
                onChange={(e) => setFormData({...formData, id: e.target.value})}
                required
              />
            </div>

            {message && message.type === 'error' && (
              <div className="form-error" style={{ textAlign: 'center', marginTop: '16px' }}>
                {message.text}
              </div>
            )}

            <button type="submit" className="btn-search" disabled={loading} style={{ marginTop: '24px' }}>
              {loading ? 'Buscando...' : 'Pesquisar'}
            </button>
          </form>
        ) : (
          <div className="result-container">
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
              Extrato - {result.period}
            </h3>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f9f9f9', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Data</th>
                    <th style={{ padding: '10px' }}>Descrição</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {result.entries.map((entry, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{entry.date}</td>
                      <td style={{ padding: '10px' }}>{entry.description}</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: entry.type === 'credit' ? 'green' : 'red' }}>
                        {entry.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem' }}>
              Saldo Final: {result.entries.reduce((acc, curr) => acc + curr.value, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button 
                onClick={() => setResult(null)} 
                className="btn-outline" 
                style={{ padding: '8px 16px', borderRadius: '20px', cursor: 'pointer' }}
              >
                Nova Pesquisa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
