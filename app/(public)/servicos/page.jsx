import Link from 'next/link';
import './servicos.css';

export const metadata = {
  title: 'Serviços Online | Consmel Imobiliária',
  description: 'Acesse nossos serviços online: emissão de boletos, extratos, informes e solicitações.',
};

export default function Servicos() {
  return (
    <>
      {/* Hero Section */}
      <section className="page-hero">
        <div className="container">
          <h1 className="animate-slide-in-up">Serviços Online</h1>
          <p className="hero-description animate-slide-in-up">
            Acesse nossos serviços de forma prática e rápida
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section">
        <div className="container">
          <div className="services-grid animate-page-entrance">
            {/* Boleto */}
            <Link href="/servicos/boleto" className="service-card">
              <div className="service-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                  <path d="M22 10H2"></path>
                  <path d="M7 15h.01"></path>
                  <path d="M11 15h2"></path>
                </svg>
              </div>
              <h3>Boleto</h3>
              <p>Emita a 2ª via do seu boleto</p>
            </Link>

            {/* Extrato */}
            <Link href="/servicos/extrato" className="service-card">
              <div className="service-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h3>Extrato</h3>
              <p>Consulte seu extrato de pagamentos</p>
            </Link>

            {/* Informe de Renda */}
            <Link href="/servicos/informe-renda" className="service-card">
              <div className="service-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
                </svg>
              </div>
              <h3>Informe de Renda</h3>
              <p>Solicite seu informe de rendimentos</p>
            </Link>

            {/* Solicitações */}
            <Link href="/solicitacoes" className="service-card">
              <div className="service-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  <path d="M9 10h6"></path>
                  <path d="M9 14h3"></path>
                </svg>
              </div>
              <h3>Solicitações</h3>
              <p>Faça uma solicitação ou tire suas dúvidas</p>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
