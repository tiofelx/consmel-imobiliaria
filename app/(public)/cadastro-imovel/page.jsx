"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { validateEmail, validatePhone, maskPhone, validateLocation, detectFraud } from '@/lib/validations';
import "./cadastre.css";


// Contact configuration - always send to both
const CONTACT_EMAIL = 'imobiliariaconsmel@gmail.com';
const WHATSAPP_NUMBER = '5517996076414';

export default function CadastreImovel() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    contato1: "",
    contato2: "",
    tipoTransacao: "",
    tipoImovel: "",
    endereco: "",
    quartos: "",
    suites: "",
    banheiros: "",
    vagas: "",
    descricao: "",
  });
  const [status, setStatus] = useState("idle");
  const [fieldErrors, setFieldErrors] = useState({});

  const [toast, setToast] = useState({ message: "", visible: false, type: "error" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Auto-mask phone fields
    if (name === 'contato1' || name === 'contato2') {
      setFormData((prev) => ({ ...prev, [name]: maskPhone(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    // Clear error on edit
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const showToast = (message, type = "error") => {
    setToast({ message, visible: true, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 4000);
  };

  // Validation Logic
  const validateStep = (step) => {
    const errors = {};

    if (step === 1) {
      if (!formData.nome || formData.nome.trim().length < 3) {
        errors.nome = 'Nome completo é obrigatório (mínimo 3 caracteres).';
      }
      const emailResult = validateEmail(formData.email);
      if (!emailResult.valid) {
        errors.email = emailResult.message;
      }
      const phoneResult = validatePhone(formData.contato1);
      if (!phoneResult.valid) {
        errors.contato1 = phoneResult.message;
      }
    }

    if (step === 2) {
      if (!formData.tipoTransacao) errors.tipoTransacao = 'Selecione o propósito.';
      if (!formData.tipoImovel) errors.tipoImovel = 'Selecione o tipo do imóvel.';
      const locationResult = validateLocation(formData.endereco);
      if (!locationResult.valid) {
        errors.endereco = locationResult.message;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    } else {
      showToast("Por favor, preencha os campos obrigatórios (*)", "error");
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  // Function to send via WhatsApp
  const sendWhatsApp = (data) => {
    const message = encodeURIComponent(
      `*Novo Cadastro de Imóvel - Site Consmel*\n\n` +
      `*Proprietário:* ${data.nome}\n` +
      `*E-mail:* ${data.email}\n` +
      `*Contato 1:* ${data.contato1}\n` +
      `*Contato 2:* ${data.contato2 || 'Não informado'}\n\n` +
      `*Tipo de Imóvel:* ${data.tipoImovel}\n` +
      `*Propósito:* ${data.tipoTransacao}\n` +
      `*Endereço:* ${data.endereco || 'Não informado'}\n` +
      `*Dormitórios:* ${data.quartos || '0'}\n` +
      `*Suítes:* ${data.suites || '0'}\n` +
      `*Banheiros:* ${data.banheiros || '0'}\n` +
      `*Garagem:* ${data.vagas || '0'}\n\n` +
      `*Descrição:*\n${data.descricao || 'Não informada'}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  // Function to send via Email
  const sendEmail = (data) => {
    const subject = encodeURIComponent('Novo Cadastro de Imóvel - Site Consmel');
    const body = encodeURIComponent(
      `Proprietário: ${data.nome}\n` +
      `E-mail: ${data.email}\n` +
      `Contato 1: ${data.contato1}\n` +
      `Contato 2: ${data.contato2 || 'Não informado'}\n\n` +
      `Tipo de Imóvel: ${data.tipoImovel}\n` +
      `Propósito: ${data.tipoTransacao}\n` +
      `Endereço: ${data.endereco || 'Não informado'}\n` +
      `Dormitórios: ${data.quartos || '0'}\n` +
      `Suítes: ${data.suites || '0'}\n` +
      `Banheiros: ${data.banheiros || '0'}\n` +
      `Garagem: ${data.vagas || '0'}\n\n` +
      `Descrição:\n${data.descricao || 'Não informada'}`
    );
    window.open(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent submission if not on the last step
    if (currentStep < 3) {
      nextStep();
      return;
    }

    setStatus("sending");

    // --- Fraud Detection ---
    const fraud = detectFraud({
      name: formData.nome,
      email: formData.email,
      phone: formData.contato1,
      address: formData.endereco,
    });

    if (fraud.suspicious) {
      try {
        await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'fraud',
            severity: fraud.severity,
            source: 'cadastro-imovel',
            name: formData.nome,
            email: formData.email,
            phone: formData.contato1,
            address: formData.endereco,
            reasons: fraud.reasons,
          }),
        });
      } catch { /* alert creation failed silently */ }
    }

    // Format details for notes
    const details = `
      Proprietário: ${formData.nome}
      Contato 1: ${formData.contato1}
      Contato 2: ${formData.contato2}
      Tipo: ${formData.tipoImovel} (${formData.tipoTransacao})
      Endereço: ${formData.endereco}
      Cômodos: ${formData.quartos} quartos, ${formData.suites} suítes, ${formData.banheiros} banheiros, ${formData.vagas} vagas
      Descrição: ${formData.descricao}
    `.trim();

    try {
      await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.nome,
          email: formData.email,
          phone: formData.contato1,
          interest: 'Cadastro de Imóvel',
          notes: details,
          status: 'Novo'
        })
      });
    } catch (err) {
      console.error('Failed to save lead', err);
    }

    // Send to BOTH email and WhatsApp simultaneously
    setTimeout(() => {
      sendEmail(formData);
      sendWhatsApp(formData);

      setStatus("success");
      showToast("Dados enviados com sucesso!", "success");

      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    }, 500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Allow Enter in textarea
      if (e.target.tagName.toLowerCase() === 'textarea') return;

      e.preventDefault();

      if (currentStep < 3) {
        nextStep();
      }
    }
  };

  return (
    <main className="cadastre-page">
      <div className="cadastre-container">

        {/* Form Container - Centered */}
        <div className="cadastre-form-container">
          <div className="form-wrapper animate-page-entrance">

            {/* Step Indicator with Labels */}
            <div className="step-indicator">
              <div className={`step-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
                <div className="step-circle">
                  {currentStep > 1 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    "1"
                  )}
                </div>
                <span className="step-label">Proprietário</span>
              </div>
              <div className={`step-line ${currentStep > 1 ? 'active' : ''}`}></div>
              <div className={`step-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>
                <div className="step-circle">
                  {currentStep > 2 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    "2"
                  )}
                </div>
                <span className="step-label">Imóvel</span>
              </div>
              <div className={`step-line ${currentStep > 2 ? 'active' : ''}`}></div>
              <div className={`step-item ${currentStep === 3 ? 'active' : ''}`}>
                <div className="step-circle">3</div>
                <span className="step-label">Detalhes</span>
              </div>
            </div>

            <div className="form-header centered-header">
              {currentStep === 1 && (
                <>
                  <h2>Seus Dados</h2>
                  <p>Vamos começar pelo proprietário</p>
                </>
              )}
              {currentStep === 2 && (
                <>
                  <h2>Sobre o Imóvel</h2>
                  <p>Qual tipo de imóvel você tem?</p>
                </>
              )}
              {currentStep === 3 && (
                <>
                  <h2>Detalhes</h2>
                  <p>Conta pra gente os diferenciais</p>
                </>
              )}
            </div>

            <form className="property-register-form" onKeyDown={handleKeyDown}>
              <div className="form-grid">

                {/* STEP 1: PROPRIETÁRIO */}
                {currentStep === 1 && (
                  <>
                    <div className="form-group span-full animate-feature-entrance">
                      <label htmlFor="nome">Proprietário *</label>
                      <div className="input-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <input
                          type="text"
                          id="nome"
                          name="nome"
                          value={formData.nome}
                          onChange={handleChange}
                          required
                          placeholder="Nome completo do proprietário"
                        />
                      </div>
                    </div>

                    <div className="form-group span-full animate-feature-entrance">
                      <label htmlFor="email">E-mail *</label>
                      <div className="input-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="seu@email.com"
                        />
                      </div>
                      {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                    </div>

                    <div className="form-group span-md-2 animate-feature-entrance">
                      <label htmlFor="contato1">Contato principal *</label>
                      <div className="input-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        <input
                          type="tel"
                          id="contato1"
                          name="contato1"
                          value={formData.contato1}
                          onChange={handleChange}
                          required
                          placeholder="(xx) xxxxx-xxxx"
                          maxLength={15}
                        />
                      </div>
                      {fieldErrors.contato1 && <span className="field-error">{fieldErrors.contato1}</span>}
                    </div>
                    <div className="form-group span-md-2 animate-feature-entrance">
                      <label htmlFor="contato2">Contato secundário</label>
                      <div className="input-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        <input
                          type="tel"
                          id="contato2"
                          name="contato2"
                          value={formData.contato2}
                          onChange={handleChange}
                          placeholder="(xx) xxxxx-xxxx"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* STEP 2: SOBRE O IMÓVEL */}
                {currentStep === 2 && (
                  <>
                    <div className="form-group span-md-2 animate-feature-entrance">
                      <label htmlFor="tipoTransacao">Propósito *</label>
                      <select
                        id="tipoTransacao"
                        name="tipoTransacao"
                        value={formData.tipoTransacao}
                        onChange={handleChange}
                        required
                        className="form-select"
                      >
                        <option value="">Selecione...</option>
                        <option value="venda">Venda</option>
                        <option value="aluguel">Aluguel</option>
                      </select>
                    </div>
                    <div className="form-group span-md-2 animate-feature-entrance">
                      <label htmlFor="tipoImovel">Tipo do Imóvel *</label>
                      <select
                        id="tipoImovel"
                        name="tipoImovel"
                        value={formData.tipoImovel}
                        onChange={handleChange}
                        required
                        className="form-select"
                      >
                        <option value="">Selecione...</option>
                        <option value="casa">Casa</option>
                        <option value="apartamento">Apartamento</option>
                        <option value="terreno">Terreno</option>
                        <option value="comercial">Comercial</option>
                        <option value="chacara">Chácara</option>
                      </select>
                    </div>

                    <div className="form-group span-full animate-feature-entrance">
                      <label htmlFor="endereco">Localização *</label>
                      <div className="input-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <input
                          type="text"
                          id="endereco"
                          name="endereco"
                          value={formData.endereco}
                          onChange={handleChange}
                          required
                          placeholder="Rua, Número - Bairro - Cidade / UF"
                        />
                      </div>
                      {fieldErrors.endereco && <span className="field-error">{fieldErrors.endereco}</span>}
                    </div>
                  </>
                )}

                {/* STEP 3: DETALHES */}
                {currentStep === 3 && (
                  <>
                    <div className="form-group span-md-1 animate-feature-entrance">
                      <label htmlFor="quartos">Dormitórios</label>
                      <input
                        type="number"
                        id="quartos"
                        name="quartos"
                        value={formData.quartos}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="0"
                      />
                    </div>
                    <div className="form-group span-md-1 animate-feature-entrance">
                      <label htmlFor="suites">Suítes</label>
                      <input
                        type="number"
                        id="suites"
                        name="suites"
                        value={formData.suites}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="0"
                      />
                    </div>
                    <div className="form-group span-md-1 animate-feature-entrance">
                      <label htmlFor="banheiros">Banheiros</label>
                      <input
                        type="number"
                        id="banheiros"
                        name="banheiros"
                        value={formData.banheiros}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="0"
                      />
                    </div>
                    <div className="form-group span-md-1 animate-feature-entrance">
                      <label htmlFor="vagas">Vagas</label>
                      <input
                        type="number"
                        id="vagas"
                        name="vagas"
                        value={formData.vagas}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="0"
                      />
                    </div>

                    <div className="form-group span-full animate-feature-entrance">
                      <label htmlFor="descricao">Descrição Adicional</label>
                      <textarea
                        id="descricao"
                        name="descricao"
                        value={formData.descricao}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Detalhes que valorizam o seu imóvel..."
                        className="form-textarea"
                      ></textarea>
                    </div>
                  </>
                )}
              </div>

              <div className="form-actions">
                {currentStep > 1 && (
                  <button type="button" onClick={prevStep} className="nav-btn prev-btn">
                    Voltar
                  </button>
                )}

                {currentStep < 3 ? (
                  <button type="button" onClick={nextStep} className="nav-btn next-btn">
                    Próximo
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="submit-btn"
                    disabled={status === "sending"}
                  >
                    {status === "sending" ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      "Finalizar"
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Custom Toast Notification - Unified */}
      <div className={`toast-notification ${toast.type} ${toast.visible ? 'show' : ''}`}>
        <div className="toast-content">
          {toast.type === "success" ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      </div>
    </main>
  );
}
