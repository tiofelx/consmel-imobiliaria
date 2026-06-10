import './despachante.css';

const WHATSAPP_HREF = 'https://wa.me/5517996076414?text=' + encodeURIComponent('Olá! Gostaria de analisar a situação do meu imóvel com a Consmel.');

const SERVICOS = [
    'Análise documental imobiliária',
    'Conferência de matrícula',
    'Regularização de imóveis',
    'Registro de escritura',
    'Averbações',
    'ITBI',
    'Exigências cartorárias',
    'Apoio documental para financiamento',
    'Diligências e acompanhamento completo',
];

const ETAPAS = [
    {
        num: '01',
        title: 'Investigamos a situação documental do imóvel',
        desc: 'Analisamos matrícula, registros, pendências e inconsistências.',
    },
    {
        num: '02',
        title: 'Organizamos toda a operação',
        desc: 'Centralizamos documentação, exigências e etapas da negociação.',
    },
    {
        num: '03',
        title: 'Acompanhamos cartórios e órgãos públicos',
        desc: 'Para reduzir atrasos, exigências e falhas operacionais.',
    },
    {
        num: '04',
        title: 'Conduzimos o processo até o registro final',
        desc: 'Com mais previsibilidade, clareza e segurança.',
    },
];

export default function DespachantePage() {
    return (
        <>
            <section className="page-hero">
                <div className="container">
                    <h1 className="animate-slide-in-up">Despachante Imobiliário</h1>
                    <p className="hero-description animate-slide-in-up">
                        Regularização, documentação e acompanhamento cartorial para sua negociação
                    </p>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="desp-problema-grid animate-page-entrance">
                        <div className="desp-problema-texto">
                            <h2>Mais de 40 milhões de imóveis urbanos no Brasil são irregulares</h2>
                            <p>
                                Essa irregularidade pode impedir que você venda, financie, transfira ou
                                inclua o imóvel em inventário — além de comprometer a valorização e gerar
                                disputas patrimoniais no futuro.
                            </p>
                            <p>
                                A <strong>Consmel</strong> atua para proteger sua negociação antes que
                                qualquer problema apareça.
                            </p>
                            <a
                                href={WHATSAPP_HREF}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary btn-lg"
                            >
                                Quero Analisar Meu Imóvel
                            </a>
                        </div>

                        <div className="desp-problema-impedimentos">
                            <h3>Isso pode impedir:</h3>
                            <ul className="desp-lista-impedimentos">
                                {['Venda', 'Financiamento', 'Transferência', 'Inventário', 'Valorização do imóvel', 'E gerar disputas patrimoniais'].map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section bg-secondary">
                <div className="container">
                    <h2 className="text-center" style={{ marginBottom: 'var(--space-4)' }}>O que fazemos</h2>
                    <p className="text-center desp-subtitulo">
                        Tudo conduzido com acompanhamento jurídico e visão preventiva.
                    </p>

                    <div className="desp-servicos-grid">
                        {SERVICOS.map((servico, i) => (
                            <div key={i} className="desp-servico-item">
                                <span className="desp-servico-icone" aria-hidden="true">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </span>
                                {servico}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <h2 className="text-center" style={{ marginBottom: 'var(--space-12)' }}>
                        Como funciona nosso serviço
                    </h2>

                    <div className="grid grid-cols-1 grid-cols-md-2">
                        {ETAPAS.map((etapa, i) => (
                            <div key={i} className="desp-etapa-item">
                                <div className="desp-etapa-num">{etapa.num}</div>
                                <h3>{etapa.title}</h3>
                                <p>{etapa.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section bg-secondary">
                <div className="container">
                    <div className="desp-dor-grid">
                        <div>
                            <h2>Você não precisa enfrentar cartórios sozinho</h2>
                            <p>
                                A maioria das pessoas entra em uma negociação imobiliária sem entender
                                os riscos que envolvem o processo. Exigências registrais, problemas na
                                matrícula e impactos jurídicos futuros normalmente só aparecem quando
                                o problema já está instalado.
                            </p>
                            <p>
                                <strong>A Consmel atua justamente para evitar esse cenário</strong> —
                                com análise prévia, acompanhamento completo e visão preventiva em
                                cada etapa da negociação.
                            </p>
                        </div>

                        <div className="desp-dor-riscos">
                            <h3>O que as pessoas não percebem a tempo:</h3>
                            <ul className="desp-lista-riscos">
                                <li>Riscos ocultos na documentação</li>
                                <li>Exigências registrais não atendidas</li>
                                <li>Problemas na matrícula do imóvel</li>
                                <li>Impactos jurídicos futuros</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section bg-secondary" style={{ borderTop: '1px solid var(--border-light)' }}>
                <div className="container text-center">
                    <h2>Quer acompanhamento especializado?</h2>
                    <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-8)' }}>
                        Fale agora conosco e tenha suporte completo na sua negociação imobiliária
                    </p>
                    <a
                        href={WHATSAPP_HREF}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-lg"
                    >
                        Falar com a Consmel
                    </a>
                </div>
            </section>
        </>
    );
}
