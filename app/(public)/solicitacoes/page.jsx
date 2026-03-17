'use client';

import { useState } from 'react';
import './solicitacoes.css';

// Contact configuration - always send to both
const CONTACT_EMAIL = 'imobiliariaconsmel@gmail.com';
const WHATSAPP_NUMBER = '5517996076414';

export default function Solicitacoes() {
  const [formData, setFormData] = useState({
    cpf: '',
    nome: '',
    celular: '',
    email: '',
    empresa: '',
    cargo: '',
    telefoneEmpresa: '',
    cidade: '',
    mensagem: ''
  });
  const [status, setStatus] = useState('idle');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Function to send via WhatsApp
  const sendWhatsApp = (data) => {
    const message = encodeURIComponent(
      `*Nova Solicitação - Site Consmel*\n\n` +
      `*CPF:* ${data.cpf}\n` +
      `*Nome:* ${data.nome}\n` +
      `*Celular:* ${data.celular}\n` +
      `*E-mail:* ${data.email}\n` +
      `*Empresa:* ${data.empresa || 'Não informado'}\n` +
      `*Cargo:* ${data.cargo || 'Não informado'}\n` +
      `*Tel. Empresa:* ${data.telefoneEmpresa || 'Não informado'}\n` +
      `*Cidade:* ${data.cidade}\n\n` +
      `*Mensagem:*\n${data.mensagem}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  // Function to send via Email
  const sendEmail = (data) => {
    const subject = encodeURIComponent('Nova Solicitação - Site Consmel');
    const body = encodeURIComponent(
      `CPF: ${data.cpf}\n` +
      `Nome: ${data.nome}\n` +
      `Celular: ${data.celular}\n` +
      `E-mail: ${data.email}\n` +
      `Empresa: ${data.empresa || 'Não informado'}\n` +
      `Cargo: ${data.cargo || 'Não informado'}\n` +
      `Tel. Empresa: ${data.telefoneEmpresa || 'Não informado'}\n` +
      `Cidade: ${data.cidade}\n\n` +
      `Mensagem:\n${data.mensagem}`
    );
    window.open(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('sending');

    // Send to BOTH email and WhatsApp simultaneously
    setTimeout(() => {
      sendEmail(formData);
      sendWhatsApp(formData);

      setStatus('success');

      setTimeout(() => {
        setFormData({
          cpf: '',
          nome: '',
          celular: '',
          email: '',
          empresa: '',
          cargo: '',
          telefoneEmpresa: '',
          cidade: '',
          mensagem: ''
        });
        setStatus('idle');
      }, 3000);
    }, 500);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="page-hero">
        <div className="container">
          <h1 className="animate-slide-in-up">Solicitações</h1>
          <p className="hero-description animate-slide-in-up">
            Preencha o formulário abaixo com sua solicitação
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="section" style={{ paddingTop: 'var(--space-6)' }}>
        <div className="container">
          <div className="request-container animate-page-entrance">
            <h2 className="form-title">Requerente</h2>

            <form onSubmit={handleSubmit} className="request-form">
              <div className="form-grid">
                <div className="form-group span-md-1">
                  <label htmlFor="cpf">CPF *</label>
                  <input
                    type="text"
                    id="cpf"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleChange}
                    required
                    placeholder="000.000.000-00"
                    className="form-input"
                  />
                </div>

                <div className="form-group span-md-3">
                  <label htmlFor="nome">Nome *</label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                    placeholder="Seu nome completo"
                    className="form-input"
                  />
                </div>

                <div className="form-group span-md-2">
                  <label htmlFor="celular">Celular *</label>
                  <input
                    type="tel"
                    id="celular"
                    name="celular"
                    value={formData.celular}
                    onChange={handleChange}
                    required
                    placeholder="(17) 99607-6414"
                    className="form-input"
                  />
                </div>

                <div className="form-group span-md-2">
                  <label htmlFor="email">E-mail *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="seu@email.com"
                    className="form-input"
                  />
                </div>

                <div className="form-group span-md-2">
                  <label htmlFor="empresa">Empresa</label>
                  <input
                    type="text"
                    id="empresa"
                    name="empresa"
                    value={formData.empresa}
                    onChange={handleChange}
                    placeholder="Nome da empresa"
                    className="form-input"
                  />
                </div>

                <div className="form-group span-md-2">
                  <label htmlFor="cargo">Cargo</label>
                  <input
                    type="text"
                    id="cargo"
                    name="cargo"
                    value={formData.cargo}
                    onChange={handleChange}
                    placeholder="Seu cargo"
                    className="form-input"
                  />
                </div>

                <div className="form-group span-md-2">
                  <label htmlFor="telefoneEmpresa">Telefone da empresa</label>
                  <input
                    type="tel"
                    id="telefoneEmpresa"
                    name="telefoneEmpresa"
                    value={formData.telefoneEmpresa}
                    onChange={handleChange}
                    placeholder="(11) 3333-3333"
                    className="form-input"
                  />
                </div>

                <div className="form-group span-md-2">
                  <label htmlFor="cidade">Cidade *</label>
                  <input
                    type="text"
                    id="cidade"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleChange}
                    required
                    placeholder="Sua cidade"
                    className="form-input"
                  />
                </div>

                <div className="form-group span-full">
                  <label htmlFor="mensagem">Mensagem *</label>
                  <textarea
                    id="mensagem"
                    name="mensagem"
                    value={formData.mensagem}
                    onChange={handleChange}
                    required
                    rows="4"
                    placeholder="Descreva sua solicitação detalhadamente"
                    className="form-textarea"
                  ></textarea>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={status === 'sending'}
                style={{ width: '100%', marginTop: 'var(--space-2)' }}
              >
                {status === 'sending' ? 'Enviando...' :
                  status === 'success' ? 'Enviado com sucesso!' :
                    'Enviar Solicitação'}
              </button>

              {status === 'success' && (
                <div className="form-success">
                  Solicitação enviada com sucesso! Entraremos em contato em breve.
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
