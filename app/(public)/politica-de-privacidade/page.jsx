import './politica.css';

export const metadata = {
  title: 'Política de Privacidade | Consmel Imobiliária',
  description: 'Política de privacidade da Consmel Imobiliária. Saiba como coletamos, usamos e protegemos suas informações pessoais.',
};

export default function PoliticaDePrivacidade() {
  return (
    <>
      {/* Hero Section */}
      <section className="page-hero">
        <div className="container">
          <h1 className="animate-slide-in-up">Políticas de Privacidade</h1>
        </div>
      </section>

      {/* Content Section */}
      <section className="section policy-content">
        <div className="container animate-page-entrance">

          {/* Intro */}
          <div className="policy-card">
            <p>
              Nós, da Imobiliária Consmel, estamos comprometidos em proteger a privacidade e os dados pessoais de nossos clientes e
              visitantes do site. Esta política de privacidade descreve como coletamos, usamos e protegemos as informações pessoais
              que você nos fornece através de nosso site.
            </p>
          </div>

          {/* Coleta de Informações */}
          <h2 className="policy-title">Coleta de Informações Pessoais</h2>
          <div className="policy-card">
            <p>
              Ao visitar nosso site e preencher nosso formulário de contato, podemos coletar informações pessoais, como seu nome,
              endereço de e-mail e número de telefone. Essas informações são usadas apenas para entrar em contato com você e
              fornecer informações sobre nossos produtos e serviços.
            </p>
          </div>

          {/* Uso de Informações */}
          <h2 className="policy-title">Uso de Informações Pessoais</h2>
          <div className="policy-card">
            <p>
              Nós não compartilhamos, vendemos ou alugamos suas informações pessoais a terceiros para fins de marketing ou
              qualquer outro propósito. Todas as informações coletadas são usadas apenas para fins de contato e para fornecer
              informações sobre nossos produtos e serviços.
            </p>
          </div>

          {/* Proteção */}
          <h2 className="policy-title">Proteção de Informações Pessoais</h2>
          <div className="policy-card">
            <p>
              As informações pessoais que você fornece serão armazenadas com segurança em um servidor protegido por medidas de
              segurança apropriadas. Todas as informações trafegadas entre o site e o servidor serão criptografadas com SSL para
              garantir a segurança das informações.
            </p>
          </div>

          {/* Cookies */}
          <h2 className="policy-title">Cookies</h2>
          <div className="policy-card">
            <p>
              Nosso site pode utilizar cookies para melhorar a experiência do usuário. Os cookies são arquivos de texto que são
              armazenados no seu dispositivo para melhorar a usabilidade do site. Você pode optar por não permitir o uso de cookies
              em seu navegador, mas isso pode afetar a funcionalidade do site.
            </p>
          </div>

          {/* Alterações */}
          <h2 className="policy-title">Alterações Nesta Política de Privacidade</h2>
          <div className="policy-card">
            <p>
              Podemos alterar esta política de privacidade a qualquer momento. Todas as alterações serão postadas nesta página e
              serão efetivas imediatamente após a publicação.
            </p>
          </div>

          {/* Contato */}
          <h2 className="policy-title">Contato</h2>
          <div className="policy-card">
            <p>
              Se você tiver alguma dúvida ou preocupação sobre nossa política de privacidade ou sobre como lidamos com suas
              informações pessoais, entre em contato conosco através dos contatos presentes no rodapé de nosso site.
            </p>
          </div>

          {/* Direitos */}
          <h2 className="policy-title">Quais os Seus Direitos Sobre Seus Dados</h2>
          <div className="policy-card">
            <p>
              Se você tiver preenchido um formulário neste site, pode solicitar um arquivo exportado dos dados pessoais que
              mantemos sobre você, inclusive quaisquer dados que nos tenha fornecido. Também pode solicitar que removamos
              qualquer dado pessoal que mantemos sobre você. Isto não inclui nenhuns dados que somos obrigados a manter para
              propósitos administrativos, legais ou de segurança.
            </p>
          </div>

        </div>
      </section>
    </>
  );
}
