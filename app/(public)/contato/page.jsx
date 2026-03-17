import ContactForm from '../../components/ContactForm';
import './contato.css';

export const metadata = {
  title: 'Contato | Consmel Imobiliária',
  description: 'Entre em contato com a Consmel Imobiliária. Estamos prontos para atender você e ajudar a encontrar o imóvel ideal.',
};

export default function Contato() {
  return (
    <>
      {/* Hero Section */}
      <section className="page-hero">
        <div className="container">
          <h1 className="animate-slide-in-up">Entre em Contato</h1>
          <p className="hero-description animate-slide-in-up">
            Estamos prontos para atender você
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section">
        <div className="container">
          <div className="contact-grid animate-page-entrance">
            {/* Contact Form */}
            <div>
              <ContactForm />
            </div>

            {/* Contact Info */}
            <div className="contact-info">
              <h3>Informações de Contato</h3>
              <p>
                Preencha o formulário ao lado ou utilize uma das opções abaixo para
                entrar em contato conosco.
              </p>

              <div className="info-card">
                <div className="info-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </div>
                <div>
                  <h4>E-mail</h4>
                  <a href="mailto:imobiliariaconsmel@gmail.com">imobiliariaconsmel@gmail.com</a>
                </div>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                  </svg>
                </div>
                <div>
                  <h4>Telefone</h4>
                  <a href="tel:+5517996076414">(17) 99607-6414</a>
                </div>
              </div>



              <div className="info-card">
                <div className="info-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
                <div>
                  <h4>Endereço</h4>
                  <p>R. Santa Gotardo da Silva, 121<br />Jardim Lhen Nicolau, Guaraci-SP<br />15420-354</p>
                </div>
              </div>

              <div className="social-links" style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
                <h4>Redes Sociais</h4>
                <div className="social-buttons" style={{ justifyContent: 'center', display: 'flex' }}>
                  <a
                    href="https://www.instagram.com/consmel.imoveis/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn instagram"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    Instagram
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="container">
          <h2 className="text-center" style={{ marginBottom: 'var(--space-8)' }}>Onde Estamos</h2>
        </div>
        <div className="map-section" style={{ height: '450px', marginTop: 'var(--space-8)' }}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d272.66132579462095!2d-48.9396451703555!3d-20.504342426564012!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94bc89984507a0cd%3A0x634909072c597085!2sImobili%C3%A1ria%20Consmel!5e1!3m2!1spt-BR!2sus!4v1772810706605!5m2!1spt-BR!2sus"
            width="100%"
            height="450"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Localização Consmel Imobiliária"
          ></iframe>
        </div>
      </section>
    </>
  );
}
