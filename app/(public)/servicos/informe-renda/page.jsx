'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ServiceAPI } from '@/lib/api';
import '../services.css';

export default function InformeRendaPage() {
  const [formData, setFormData] = useState({
    userType: 'locador',
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
      const response = await ServiceAPI.getInformeRenda(formData.document, formData.userType);
      setResult(response.data);
      setMessage({ type: 'success', text: response.message });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Erro ao buscar informe.' });
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
          <h1 className="service-title">Informe de Renda</h1>
        </div>

        {!result ? (
          <form className="service-form" onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label className="input-label" style={{ marginBottom: '12px' }}>Você é:</label>
              <div className="form-group-radio" style={{ marginBottom: '12px' }}>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="userType" 
                    className="radio-input"
                    checked={formData.userType === 'locador'}
                    onChange={() => setFormData({...formData, userType: 'locador'})}
                  />
                  Locador
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="userType" 
                    className="radio-input"
                    checked={formData.userType === 'locatario'}
                    onChange={() => setFormData({...formData, userType: 'locatario'})}
                  />
                  Locatário
                </label>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label className="input-label" style={{ fontWeight: 'normal', color: '#666' }}>ID (Código):</label>
              <input
                type="text"
                className="form-input-service"
                placeholder="Seu ID"
                value={formData.id}
                onChange={(e) => setFormData({...formData, id: e.target.value})}
                required
              />
            </div>

            <div style={{ marginTop: '16px' }}>
              <div className="form-group-radio" style={{ marginBottom: '8px', justifyContent: 'flex-start' }}>
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
              <input
                type="text"
                className="form-input-service"
                placeholder={formData.docType === 'cpf' ? "CPF (apenas números)" : "CNPJ (apenas números)"}
                value={formData.document}
                onChange={(e) => setFormData({...formData, document: e.target.value})}
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
          <div className="result-container" style={{ textAlign: 'center' }}>
            <div style={{ color: 'green', marginBottom: '20px', fontSize: '1.1rem' }}>
              ✔ {message.text}
            </div>
            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#e85d2c', marginBottom: '10px' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <p style={{ fontWeight: 'bold' }}>{result.fileName}</p>
            </div>
            
            <a href="#" className="btn-primary" style={{ padding: '10px 20px', borderRadius: '20px', textDecoration: 'none', display: 'inline-block' }}>
              Baixar PDF
            </a>

            <div style={{ marginTop: '20px' }}>
              <button 
                onClick={() => setResult(null)} 
                className="btn-outline" 
                style={{ padding: '8px 16px', borderRadius: '20px', cursor: 'pointer' }}
              >
                Voltar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
