'use client';

import { useState } from 'react';
import './ContactForm.css';

// Contact configuration
const CONTACT_EMAIL = 'imobiliariaconsmel@gmail.com';
const WHATSAPP_NUMBER = '5517996076414';

export default function ContactForm({ propertyTitle }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    phone2: '',
    message: '',
    contactViaEmail: false,
    contactViaWhatsApp: false
  });
  const [status, setStatus] = useState('idle'); // idle, sending, success, error


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openWhatsApp = (data) => {
    const text = encodeURIComponent(
      `*Novo contato do site*\n\n` +
      `*Nome:* ${data.name}\n` +
      `*E-mail:* ${data.email}\n` +
      `*Contato 1:* ${data.phone}\n` +
      (data.phone2 ? `*Contato 2:* ${data.phone2}\n` : '') +
      (propertyTitle ? `*Imóvel:* ${propertyTitle}\n` : '') +
      (data.message ? `*Mensagem:* ${data.message}` : '')
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.contactViaEmail && !formData.contactViaWhatsApp) {
      alert('Por favor, selecione pelo menos uma forma de contato (E-mail ou WhatsApp)');
      return;
    }

    setStatus('sending');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          phone2: formData.phone2 || null,
          message: formData.message || null,
          propertyTitle: propertyTitle || null,
          contactViaEmail: formData.contactViaEmail,
          contactViaWhatsApp: formData.contactViaWhatsApp,
        }),
      });

      if (!res.ok) throw new Error('Falha no envio');
    } catch {
      setStatus('error');
      return;
    }

    if (formData.contactViaWhatsApp) {
      openWhatsApp(formData);
    }

    setStatus('success');

    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        phone: '',
        phone2: '',
        message: '',
        contactViaEmail: false,
        contactViaWhatsApp: false,
      });
      setStatus('idle');
    }, 3000);
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-form-header">
        <h3 className="contact-form-title">
          {propertyTitle ? 'Gostou desse imóvel?' : 'Preencha o formulário abaixo'}
        </h3>
        {propertyTitle && (
          <p className="contact-form-subtitle">Deixe seu contato!</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="name" className="form-label">Nome *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="form-input"
          placeholder="Insira seu nome"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label">E-mail *</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="form-input"
          placeholder="nome@email.com.br"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone" className="form-label">Contato 1 *</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="form-input"
          placeholder="(xx) xxxxx-xxxx ou xxxx-xxxx"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone2" className="form-label">Contato 2</label>
        <input
          type="tel"
          id="phone2"
          name="phone2"
          value={formData.phone2 || ''}
          onChange={handleChange}
          className="form-input"
          placeholder="(xx) xxxxx-xxxx ou xxxx-xxxx"
        />
      </div>

      <div className="form-group">
        <label htmlFor="message" className="form-label">Mensagem</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          className="form-textarea"
          rows="4"
        ></textarea>
      </div>

      <div className="form-group checkbox-group">
        <label className="form-label">Receber contato via: *</label>
        <div className="checkbox-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="contactViaEmail"
              checked={formData.contactViaEmail}
              onChange={handleChange}
            /> E-mail
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="contactViaWhatsApp"
              checked={formData.contactViaWhatsApp}
              onChange={handleChange}
            /> WhatsApp
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-submit"
          disabled={status === 'sending'}
        >
          {status === 'sending' ? 'Enviando...' :
            status === 'success' ? 'Enviado!' :
            status === 'error' ? 'Tentar novamente' :
              'Enviar'}
        </button>
      </div>

      {status === 'success' && (
        <div className="form-success">
          Mensagem enviada!
        </div>
      )}
      {status === 'error' && (
        <div className="form-error">
          Erro ao enviar. Tente novamente ou entre em contato pelo WhatsApp.
        </div>
      )}
    </form>
  );
}
