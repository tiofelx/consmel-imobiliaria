'use client';

import { useState } from 'react';
import Link from 'next/link';
import '../servicos/services.css';

export default function EsqueciSenha() {
    const [step, setStep] = useState('email');
    const [form, setForm] = useState({ email: '', token: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const set = (name) => (e) => setForm((prev) => ({ ...prev, [name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch(step === 'email' ? '/api/auth/forgot-password' : '/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(step === 'email' ? { email: form.email } : { token: form.token, password: form.password }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) setError(data.error || 'Não foi possível continuar.');
            else if (step === 'email') setStep('code');
            else {
                window.location.href = data.redirectUrl || '/login';
                return;
            }
        } catch {
            setError('Erro de conexão. Tente novamente.');
        }
        setLoading(false);
    };

    return (
        <div className="service-page">
            <div className="service-card">
                <div className="service-header">
                    <h1 className="service-title">Redefinir senha</h1>
                </div>

                <form className="service-form" onSubmit={handleSubmit}>
                    {step === 'email' ? (
                        <div>
                            <label className="input-label" htmlFor="email">E-mail da conta</label>
                            <input id="email" type="email" className="form-input-service" value={form.email} onChange={set('email')} maxLength={150} autoComplete="email" required />
                        </div>
                    ) : (
                        <>
                            <p role="status">Se o e-mail tiver uma conta, enviamos um código de 8 dígitos. Ele vale por 15 minutos.</p>
                            <div style={{ marginTop: 16 }}>
                                <label className="input-label" htmlFor="token">Código recebido</label>
                                <input id="token" inputMode="numeric" className="form-input-service" value={form.token} onChange={set('token')} maxLength={8} autoComplete="one-time-code" required />
                            </div>
                            <div style={{ marginTop: 16 }}>
                                <label className="input-label" htmlFor="password">Nova senha (mínimo 8 caracteres)</label>
                                <input id="password" type="password" className="form-input-service" value={form.password} onChange={set('password')} minLength={8} maxLength={100} autoComplete="new-password" required />
                            </div>
                        </>
                    )}

                    {error && <div role="alert" className="form-error" style={{ textAlign: 'center', marginTop: 16 }}>{error}</div>}

                    <button type="submit" className="btn-search" disabled={loading} style={{ marginTop: 24 }}>
                        {loading ? 'Aguarde...' : step === 'email' ? 'Enviar código' : 'Salvar nova senha'}
                    </button>
                    <p style={{ marginTop: 16, textAlign: 'center' }}>
                        <Link href="/login">Voltar ao login</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
