'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import './LancamentoPopup.css';

const STORAGE_KEY = 'consmel_lancamento_popup_seen';

export default function LancamentoPopup() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (sessionStorage.getItem(STORAGE_KEY)) return;

        const t = setTimeout(() => setIsMounted(true), 1500);

        return () => clearTimeout(t);
    }, []);

    function handleClose() {
        setIsMounted(false);
        sessionStorage.setItem(STORAGE_KEY, '1');
    }

    function handleOverlayClick(e) {
        if (e.target === e.currentTarget) handleClose();
    }

    if (!isMounted) return null;

    const cls = (base) => base;

    return (
        <div className={cls('lp-popup-overlay')} onClick={handleOverlayClick}
             role="dialog" aria-modal="true" aria-label="Lançamento do novo lote">

            <div className={cls('lp-popup-border')}>
                <article className={cls('lp-popup-card')}>

                    <button className="lp-popup-close" onClick={handleClose} aria-label="Fechar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>

                    <div className="lp-popup-content">

                        <div className="lp-popup-badge">
                            <span className="lp-popup-badge-dot" aria-hidden="true"/>
                            Lançamento em Breve
                        </div>

                        <h2 className="lp-popup-headline">
                            O Endereço Mais<br/>Desejado de Guaraci
                        </h2>

                        <p className="lp-popup-sub">
                            Ao lado da Lagoa Municipal — uma oportunidade única de investir
                            em um dos pontos mais valorizados da cidade.
                        </p>

                        <div className="lp-popup-location">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                            Lagoa Municipal · Guaraci — SP
                        </div>

                        <div className="lp-popup-actions">
                            <Link href="/lancamento" className="lp-popup-cta"
                                  onClick={() => sessionStorage.setItem(STORAGE_KEY, '1')}>
                                <span>Quero Saber Mais</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                     stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                    <polyline points="12 5 19 12 12 19"/>
                                </svg>
                            </Link>
                        </div>

                    </div>
                </article>
            </div>
        </div>
    );
}
