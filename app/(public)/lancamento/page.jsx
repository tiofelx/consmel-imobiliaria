'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import './lancamento.css';

const WHATSAPP_NUMBER = '5517996076414';
const WHATSAPP_MESSAGE = encodeURIComponent(
    'Olá! Me cadastrei no lançamento do novo lote da Consmel e gostaria de receber mais informações.'
);

const DIFERENCIAIS = [
    {
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
            </svg>
        ),
        title: 'Localização Privilegiada',
        desc: 'Ao lado da Lagoa Municipal, em uma das regiões com maior potencial de valorização da cidade.',
    },
    {
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
        ),
        title: 'Qualidade de Vida',
        desc: 'Mais contato com natureza, tranquilidade e espaços ideais para viver bons momentos em família.',
    },
    {
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
        ),
        title: 'Planejamento Urbano',
        desc: 'Infraestrutura moderna, ruas planejadas e um projeto pensado para o crescimento da região.',
    },
    {
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
        ),
        title: 'Investimento Inteligente',
        desc: 'Uma oportunidade para quem deseja investir em uma área estratégica e promissora.',
    },
    {
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        ),
        title: 'Exclusividade de Lançamento',
        desc: 'As melhores condições estarão disponíveis para quem se cadastrar antecipadamente.',
    },
];

const PROXIMIDADES = [
    'Área de lazer',
    'Comércios',
    'Escolas',
    'Serviços essenciais',
    'Vias de acesso rápido',
];

export default function LancamentoPage() {
    const formRef = useRef(null);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [status, setStatus] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
        );

        const targets = document.querySelectorAll('.lp-reveal');
        targets.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    function scrollToForm() {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            const digits = value.replace(/\D/g, '').slice(0, 11);
            let formatted = '';
            if (digits.length === 0) {
                formatted = '';
            } else if (digits.length <= 2) {
                formatted = `(${digits}`;
            } else if (digits.length <= 6) {
                formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
            } else if (digits.length <= 10) {
                formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
            } else {
                formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
            }
            setFormData(prev => ({ ...prev, phone: formatted }));
        } else if (name === 'name') {
            const filtered = value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, '');
            setFormData(prev => ({ ...prev, name: filtered }));
        } else if (name === 'email') {
            setFormData(prev => ({ ...prev, email: value.replace(/\s/g, '') }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setStatus('loading');
        setErrorMsg('');

        try {
            const res = await fetch('/api/lancamento-leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const json = await res.json();

            if (!res.ok) {
                setErrorMsg(json.error || 'Erro ao enviar. Tente novamente.');
                setStatus('error');
                return;
            }

            setStatus('success');
        } catch {
            setErrorMsg('Erro de conexão. Verifique sua internet e tente novamente.');
            setStatus('error');
        }
    }

    const videoRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const FADE_S = 0.65;
        let fading = false;

        const onTimeUpdate = () => {
            if (!fading && video.duration && video.currentTime >= video.duration - FADE_S) {
                fading = true;
                video.classList.add('lp-hero-video--fading');
            }
        };

        const onEnded = () => {
            video.currentTime = 0;
            const p = video.play();
            if (p) p.catch(() => {});
            requestAnimationFrame(() => requestAnimationFrame(() => {
                video.classList.remove('lp-hero-video--fading');
                fading = false;
            }));
        };

        const tryPlay = () => {
            const p = video.play();
            if (p) p.catch(() => {});
        };

        const onFirstInteraction = () => {
            if (video.paused) tryPlay();
            window.removeEventListener('touchstart', onFirstInteraction);
            window.removeEventListener('click', onFirstInteraction);
        };

        tryPlay();
        window.addEventListener('touchstart', onFirstInteraction, { passive: true });
        window.addEventListener('click', onFirstInteraction);

        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('ended', onEnded);
        return () => {
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('ended', onEnded);
            window.removeEventListener('touchstart', onFirstInteraction);
            window.removeEventListener('click', onFirstInteraction);
        };
    }, []);

    return (
        <main className="lancamento-page">
            <div className="lp-curtain" aria-hidden="true" />

            <section className="lp-hero">
                <div className="lp-hero-bg" aria-hidden="true">
                    <video
                        ref={videoRef}
                        className="lp-hero-video"
                        autoPlay
                        muted
                        playsInline
                        preload="auto"
                        poster="/videos/lote-lagoa-poster.jpg"
                    >
                        <source src="/videos/lote-lagoa-web.mp4" type="video/mp4" />
                    </video>
                </div>
                <div className="lp-hero-glow" aria-hidden="true" />
                <div className="lp-hero-wave" aria-hidden="true" />

                <div className="container lp-hero-content">
                    <div className="lp-hero-inner">
                        <div className="lp-badge" aria-label="Novo lançamento em breve">
                            <span className="lp-badge-dot" aria-hidden="true" />
                            Em Breve — Guaraci · SP
                        </div>

                        <h1 className="lp-hero-headline">
                            O endereço mais<br />desejado de Guaraci
                        </h1>

                        <p className="lp-hero-sub">
                            O mais novo residencial da cidade chega na localização mais desejada de Guaraci:
                            ao lado da <strong>Lagoa Municipal</strong>.
                        </p>

                        <p className="lp-hero-cta-text">
                            Cadastre-se agora e tenha acesso antecipado às condições exclusivas de lançamento.
                        </p>

                        <button className="btn-lp-primary" onClick={scrollToForm}>
                            Quero Receber as Informações
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <polyline points="19 12 12 19 5 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </section>

            <section className="lp-section lp-emocional">
                <div className="container lp-section-inner lp-emocional-inner">
                    <div className="lp-reveal lp-stagger-1">
                        <div className="lp-section-label">Mais do que um endereço</div>
                    </div>
                    <h2 className="lp-emocional-headline lp-reveal lp-stagger-2">
                        Um novo jeito de<br />viver Guaraci
                    </h2>
                    <div className="lp-emocional-divider lp-reveal lp-stagger-2" />
                    <p className="lp-emocional-text lp-reveal lp-stagger-3">
                        Imagine viver em uma região valorizada, cercada por natureza, lazer e tranquilidade,
                        sem abrir mão da praticidade do dia a dia.
                    </p>
                    <p className="lp-emocional-text lp-reveal lp-stagger-4">
                        Esse novo empreendimento nasce em um dos pontos mais especiais da cidade, próximo à Lagoa Municipal,
                        em uma localização pensada para quem deseja construir{' '}
                        <strong>patrimônio, qualidade de vida</strong> e um futuro seguro para a família.
                    </p>
                    <p className="lp-emocional-highlight lp-reveal lp-stagger-5">
                        Um projeto criado para marcar uma nova fase de Guaraci.
                    </p>
                </div>
            </section>

            <section className="lp-section lp-diferenciais">
                <div className="container lp-section-inner">
                    <div className="lp-reveal lp-stagger-1">
                        <div className="lp-section-label lp-label-light">Diferenciais</div>
                    </div>
                    <h2 className="lp-diferenciais-headline lp-reveal lp-stagger-2">
                        Por que esse empreendimento será um dos mais desejados de Guaraci?
                    </h2>

                    <div className="lp-diferenciais-grid">
                        {DIFERENCIAIS.map((item, i) => (
                            <div
                                key={i}
                                className={`lp-diferencial-card lp-reveal lp-stagger-${Math.min(i + 1, 5)}`}
                            >
                                <div className="lp-diferencial-icon" aria-hidden="true">
                                    {item.icon}
                                </div>
                                <h3 className="lp-diferencial-title">{item.title}</h3>
                                <p className="lp-diferencial-desc">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="lp-section lp-aspiracional">
                <div className="container lp-section-inner lp-aspiracional-inner">
                    <blockquote className="lp-aspiracional-quote lp-reveal lp-stagger-1">
                        <p>Alguns lugares são apenas locais para morar.</p>
                        <p>
                            Outros se tornam referência, despertam desejo e se transformam em{' '}
                            <strong>patrimônio para gerações</strong>.
                        </p>
                    </blockquote>
                    <p className="lp-aspiracional-body lp-reveal lp-stagger-2">
                        Esse empreendimento nasce exatamente assim: moderno, estratégico e conectado ao que
                        Guaraci tem de melhor. Um cenário pensado para quem quer{' '}
                        <strong>morar bem e investir ainda melhor</strong>.
                    </p>
                    <div className="lp-aspiracional-tag lp-reveal lp-stagger-3">
                        O endereço que vai transformar a forma como você vive Guaraci.
                    </div>
                </div>
            </section>

            <section className="lp-section lp-localizacao">
                <div className="container lp-section-inner">
                    <div className="lp-reveal lp-stagger-1">
                        <div className="lp-section-label">Localização</div>
                    </div>
                    <h2 className="lp-localizacao-headline lp-reveal lp-stagger-2">
                        Ao lado da Lagoa Municipal.<br />Perto de tudo o que importa.
                    </h2>
                    <p className="lp-localizacao-sub lp-reveal lp-stagger-3">
                        Uma das regiões mais valorizadas e desejadas da cidade, com fácil acesso
                        aos principais pontos de Guaraci.
                    </p>
                    <div className="lp-proximidades-grid lp-reveal lp-stagger-4">
                        {PROXIMIDADES.map((item, i) => (
                            <div key={i} className="lp-proximidade-item">
                                <span className="lp-proximidade-check" aria-hidden="true">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </span>
                                {item}
                            </div>
                        ))}
                    </div>
                    <div className="lp-localizacao-actions lp-reveal lp-stagger-5">
                        <a
                            href="https://maps.app.goo.gl/aA6MJ1ZQeaCjwTgeA"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-lp-maps"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                            Ver no Google Maps
                        </a>
                    </div>
                </div>
            </section>

            <section className="lp-section lp-escassez">
                <div className="container lp-section-inner lp-escassez-inner">
                    <div className="lp-escassez-icon lp-reveal lp-stagger-1" aria-hidden="true">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                    <h2 className="lp-escassez-headline lp-reveal lp-stagger-2">
                        As primeiras unidades terão condições especiais.
                    </h2>
                    <p className="lp-escassez-sub lp-reveal lp-stagger-3">
                        Quem chega primeiro garante melhores oportunidades de escolha e condições exclusivas
                        de lançamento. Cadastre-se agora para receber as informações antes da abertura oficial.
                    </p>
                    <div className="lp-reveal lp-stagger-4">
                        <button className="btn-lp-primary btn-lp-primary-light" onClick={scrollToForm}>
                            Quero Participar do Lançamento
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <polyline points="19 12 12 19 5 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </section>

            <section className="lp-section lp-form-section" ref={formRef}>
                <div className="container lp-section-inner">
                    <div className="lp-reveal lp-stagger-1">
                        <div className="lp-section-label">Cadastro Antecipado</div>
                    </div>
                    <h2 className="lp-form-headline lp-reveal lp-stagger-2">
                        Faça parte desse novo momento de Guaraci.
                    </h2>
                    <p className="lp-form-sub lp-reveal lp-stagger-3">
                        Preencha seus dados e receba informações antecipadas, tabela de lançamento
                        e condições exclusivas para cadastrados.
                    </p>

                    <div className="lp-form-wrapper lp-reveal lp-stagger-4">
                        {status === 'success' ? (
                            <div className="lp-success-state">
                                <div className="lp-success-icon" aria-hidden="true">
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                                <h3>Cadastro realizado com sucesso!</h3>
                                <p>Em breve você receberá as informações exclusivas do lançamento.</p>
                                <p className="lp-success-extra">Quer falar diretamente com um consultor?</p>
                                <a
                                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-lp-whatsapp"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                                    </svg>
                                    Falar no WhatsApp
                                </a>
                            </div>
                        ) : (
                            <form className="lp-form" onSubmit={handleSubmit} noValidate>
                                <div className="lp-form-field">
                                    <label htmlFor="lp-name" className="lp-form-label">Nome completo</label>
                                    <input
                                        id="lp-name"
                                        name="name"
                                        type="text"
                                        className="lp-form-input"
                                        placeholder="Seu nome"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        autoComplete="name"
                                    />
                                </div>

                                <div className="lp-form-field">
                                    <label htmlFor="lp-phone" className="lp-form-label">WhatsApp</label>
                                    <input
                                        id="lp-phone"
                                        name="phone"
                                        type="tel"
                                        inputMode="numeric"
                                        className="lp-form-input"
                                        placeholder="(17) 99999-9999"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        autoComplete="tel"
                                        maxLength={16}
                                    />
                                </div>

                                <div className="lp-form-field">
                                    <label htmlFor="lp-email" className="lp-form-label">E-mail</label>
                                    <input
                                        id="lp-email"
                                        name="email"
                                        type="email"
                                        className="lp-form-input"
                                        placeholder="seu@email.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        autoComplete="email"
                                    />
                                </div>

                                {status === 'error' && (
                                    <p className="lp-form-error" role="alert">{errorMsg}</p>
                                )}

                                <button
                                    type="submit"
                                    className="btn-lp-primary btn-lp-submit"
                                    disabled={status === 'loading'}
                                    aria-busy={status === 'loading'}
                                >
                                    {status === 'loading' ? (
                                        <>
                                            <span className="lp-spinner" aria-hidden="true" />
                                            Enviando...
                                        </>
                                    ) : (
                                        'Quero Receber em Primeira Mão'
                                    )}
                                </button>

                                <p className="lp-form-privacy">
                                    Seus dados estão seguros. Não fazemos spam.
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </section>

        </main>
    );
}
