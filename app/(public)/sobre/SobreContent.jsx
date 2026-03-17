'use client';

import { useState } from 'react';
import ContactModal from '@/app/components/ContactModal';
import './sobre.css';

export default function SobreContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Hero Section */}
      <section className="page-hero">
        <div className="container">
          <h1 className="animate-slide-in-up">Sobre a Consmel</h1>
          <p className="hero-description animate-slide-in-up">
            Sua parceira de confiança no mercado imobiliário
          </p>
        </div>
      </section>

      {/* Company Story */}
      <section className="section">
        <div className="container">
          <div className="content-grid animate-page-entrance">
            <div className="content-column">
              <h2>Nossa História</h2>
              <p>
                A <strong>Consmel Imobiliária</strong> nasceu do sonho de tornar a busca por
                imóveis mais transparente, segura e acessível para todos. Com mais de 15 anos no mercado,
                construímos uma reputação sólida baseada em confiança, dedicação e resultados.
              </p>
              <p>
                Ao longo dos anos, ajudamos milhares de famílias a encontrarem o lar dos seus sonhos e
                auxiliamos investidores a fazerem negócios lucrativos. Nosso compromisso é com a
                excelência em cada etapa do processo.
              </p>
            </div>
            <div className="content-column">
              <div className="highlight-box">
                <h3>Creci/SP 048265-J</h3>
                <p>Imobiliária regularizada e credenciada pelo CRECI</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="section bg-secondary">
        <div className="container">
          <div className="mvv-grid">
            <div className="mvv-card">
              <div className="mvv-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h3>Missão</h3>
              <p>
                Facilitar a realização do sonho da casa própria e proporcionar experiências
                excepcionais em transações imobiliárias, priorizando transparência e segurança.
              </p>
            </div>

            <div className="mvv-card">
              <div className="mvv-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </div>
              <h3>Visão</h3>
              <p>
                Ser referência no mercado imobiliário, reconhecida pela qualidade de serviço,
                inovação e compromisso com a satisfação dos nossos clientes.
              </p>
            </div>

            <div className="mvv-card">
              <div className="mvv-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h3>Valores</h3>
              <ul>
                <li>Transparência em todas as negociações</li>
                <li>Comprometimento com resultados</li>
                <li>Ética e profissionalismo</li>
                <li>Respeito ao cliente</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Our Differentials */}
      <section className="section">
        <div className="container">
          <h2 className="text-center" style={{ marginBottom: 'var(--space-12)' }}>
            Nossos Diferenciais
          </h2>

          <div className="grid grid-cols-1 grid-cols-md-2">
            <div className="diferencial-item">
              <div className="diferencial-number">01</div>
              <h3>Portfólio Diversificado</h3>
              <p>
                Ampla variedade de imóveis cuidadosamente selecionados para atender diferentes
                perfis e orçamentos.
              </p>
            </div>

            <div className="diferencial-item">
              <div className="diferencial-number">02</div>
              <h3>Atendimento Personalizado</h3>
              <p>
                Consultores especializados dedicados a entender suas necessidades e encontrar
                a solução perfeita.
              </p>
            </div>

            <div className="diferencial-item">
              <div className="diferencial-number">03</div>
              <h3>Processos Ágeis</h3>
              <p>
                Processos otimizados e digitalizados para tornar sua experiência mais rápida e
                conveniente.
              </p>
            </div>

            <div className="diferencial-item">
              <div className="diferencial-number">04</div>
              <h3>Pós-Venda Ativo</h3>
              <p>
                Acompanhamento completo mesmo após a conclusão do negócio, garantindo sua
                total satisfação.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-simple section bg-secondary">
        <div className="container text-center">
          <h2>Quer conhecer mais sobre a Consmel?</h2>
          <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-8)' }}>
            Entre em contato conosco e descubra como podemos ajudar você
          </p>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-lg">
            Fale Conosco
          </button>
        </div>
      </section>

      <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
