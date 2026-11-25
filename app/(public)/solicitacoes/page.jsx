'use client';

import { useState } from 'react';
import './solicitacoes.css';

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
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStatus('idle');
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Links clicados pelo usuário: window.open automático é barrado como pop-up.
  const whatsAppUrl = (data) => {
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
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  };

  const mailtoUrl = (data) => {
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
    return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setError('');

    let failure = 'Não foi possível enviar. Verifique sua conexão e tente novamente.';
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.nome,
          email: formData.email,
          phone: formData.celular,
          interest: 'Solicitação',
          // O CPF não é gravado no banco: segue só na mensagem que o próprio usuário envia.
          notes: [
            `Empresa: ${formData.empresa || 'Não informado'}`,
            `Cargo: ${formData.cargo || 'Não informado'}`,
            `Tel. Empresa: ${formData.telefoneEmpresa || 'Não informado'}`,
            `Cidade: ${formData.cidade}`,
            `Mensagem: ${formData.mensagem}`,
          ].join('\n'),
        }),
      });
      if (res.ok) {
        failure = '';
      } else {
        const body = await res.json().catch(() => ({}));
        failure = body.details?.[0]?.message || body.error || 'Não foi possível enviar. Tente novamente.';
      }
    } catch (err) {
      console.error('Failed to save request', err);
    }

    setError(failure);
    setStatus(failure ? 'idle' : 'success');
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1 className="animate-slide-in-up">Solicitações</h1>
          <p className="hero-description animate-slide-in-up">
            Preencha o formulário abaixo com sua solicitação
          </p>
        </div>
      </section>

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
                    maxLength={100}
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
                    maxLength={20}
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
                    maxLength={150}
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
                    maxLength={100}
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
                    maxLength={100}
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
                    maxLength={20}
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
                    maxLength={100}
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
                    maxLength={1000}
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
                disabled={status === 'sending' || status === 'success'}
                style={{ width: '100%', marginTop: 'var(--space-2)' }}
              >
                {status === 'sending' ? 'Enviando...' :
                  status === 'success' ? 'Enviado com sucesso!' :
                    'Enviar Solicitação'}
              </button>

              {error && (
                <div role="alert" style={{ color: '#dc2626', textAlign: 'center' }}>{error}</div>
              )}

              {status === 'success' && (
                <div className="form-success" role="status">
                  Solicitação registrada! Entraremos em contato em breve. Para agilizar, envie também por{' '}
                  <a href={whatsAppUrl(formData)} target="_blank" rel="noopener noreferrer"><strong>WhatsApp</strong></a>
                  {' '}ou <a href={mailtoUrl(formData)}><strong>e-mail</strong></a> (a mensagem inclui o CPF).
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
