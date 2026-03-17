'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ServiceAPI } from '@/lib/api';
import '../services.css';

export default function BoletoPage() {
  const [formData, setFormData] = useState({
    docType: 'cpf',
    document: '',
    code: ''
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
      const response = await ServiceAPI.getBoleto(formData.document, formData.code);
      setResult(response);
      setMessage({ type: 'success', text: response.message });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Erro ao processar solicitação.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="service-page">
      <div className="service-card animate-page-entrance">
        <div className="service-header">
          <Link href="/servicos" className="service-back-link">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v18h-6M10 17l5-5-5-5M13.8 12H3" />
            </svg>
          </Link>
          <h1 className="service-title">Emissão de boleto</h1>
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
              <label className="input-label" style={{ fontWeight: 'normal', color: '#666' }}>Código (Opcional):</label>
              <input
                type="text"
                className="form-input-service"
                placeholder="Código do Imóvel/Contrato"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
              />
            </div>

            {message && message.type === 'error' && (
              <div className="form-error" style={{ textAlign: 'center', marginTop: '16px' }}>
                {message.text}
              </div>
            )}

            <button type="submit" className="btn-search" disabled={loading} style={{ marginTop: '24px' }}>
              {loading ? 'Pesquisando...' : 'Pesquisar'}
            </button>
          </form>
        ) : (
          <div className="result-container" style={{ textAlign: 'center' }}>
            <div style={{ color: 'green', marginBottom: '20px', fontSize: '1.1rem' }}>
              ✔ {message.text}
            </div>
            <p>Protocolo: <strong>{result.data.protocol}</strong></p>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
              Verifique sua caixa de entrada (e spam) nos próximos minutos.
            </p>
            <button 
              onClick={() => setResult(null)} 
              className="btn-outline" 
              style={{ marginTop: '20px', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer' }}
            >
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
