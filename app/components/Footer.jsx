import Link from 'next/link';
import Image from 'next/image';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Company Info */}
          <div className="footer-section">
            <div className="footer-brand">
              <div className="footer-logo">
                <Image
                  src="/images/footer.svg"
                  alt="Consmel Imobiliária"
                  width={110}
                  height={110}
                  className="footer-logo-image"
                  priority
                />
              </div>
              <div className="brand-content">
                <h4 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>Consmel Imobiliária & Despachante</h4>
                <p className="footer-description" style={{ marginBottom: '8px' }}>
                  Soluções imobiliárias completas.
                </p>
                <p style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-primary)',
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                  marginBottom: '8px'
                }}>
                  COMPRA | VENDA | LOCAÇÃO | REGULARIZAÇÃO
                </p>
                <p className="footer-description">
                  Despachante Imobiliário
                </p>
              </div>
            </div>
          </div>




          {/* Services */}
          <div className="footer-section">
            <h4 className="footer-title">Serviços</h4>
            <ul className="footer-links">
              <li><Link href="/imoveis?tipo=venda">Compra de Imóveis</Link></li>
              <li><Link href="/imoveis?tipo=aluguel">Aluguel de Imóveis</Link></li>
              <li><Link href="/contato">Avaliação de Imóveis</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-section">
            <h4 className="footer-title">Contato</h4>
            <ul className="footer-contact">
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                </svg>
                <span>(17) 99607-6414</span>
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                <span>imobiliariaconsmel@gmail.com</span>
              </li>
              <li className="footer-address-item">
                <div className="footer-address-container">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="footer-address-icon">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <div className="footer-address-text">
                    <span>R. Santa Gotardo da Silva, 121</span><br />
                    <span>Jardim Lhen Nicolau</span><br />
                    <span>Guaraci-SP, 15420-354</span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom" style={{ marginTop: '40px', paddingTop: '30px' }}>
          <p><Link href="/politica-de-privacidade" style={{ color: 'inherit', textDecoration: 'underline' }}>Política de Privacidade</Link></p>
          <p>&copy; {currentYear} Consmel Imobiliária. Todos os direitos reservados.</p>
          <p className="footer-creci">Creci/SP 048265-J</p>
        </div>
      </div>
    </footer>
  );
}
