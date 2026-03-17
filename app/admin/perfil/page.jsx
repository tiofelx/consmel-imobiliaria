'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import './perfil.css';

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [qrCode, setQrCode] = useState(null);
    const [secret, setSecret] = useState(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);

    useEffect(() => {
        // Fetch user info (simulated or real endpoint needed here if not in session/context)
        // For now, let's assume we can get basic info or need to fetch it.
        // In a real app, you'd likely have a /api/me endpoint or use the session.
        // Given existing auth, let's try to get current user capabilities or infer from session
        // However, we probably need a /api/me endpoint.
        // Let's implement a quick fetch logic assuming we can get 2FA status from a new endpoint or existing one.
        // Since we don't have /api/me explicitly found, we might need to rely on the generate endpoint initial check or add one.
        // For now, let's just start with the "Generate" flow which checks user.

        // Actually, let's fetch basic status first. We can reuse the generate endpoint logic partially or just try to generate and see if it returns "already enabled" or similar if we modify it, but standard flow is robust.
        // Let's assume user starts with "Enable 2FA" button to check status.
    }, []);

    const handleEnable2FA = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/2fa/generate');
            const data = await res.json();

            if (res.ok) {
                setQrCode(data.qrCodeUrl);
                setSecret(data.secret);
            } else {
                setError(data.error || 'Erro ao gerar QR Code.');
            }
        } catch (err) {
            setError('Erro de conexão.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify2FA = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await fetch('/api/auth/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: verificationCode }),
            });
            const data = await res.json();

            if (res.ok) {
                setSuccess('Autenticação de Dois Fatores ativada com sucesso!');
                setIs2FAEnabled(true);
                setQrCode(null); // Clear QR code on success
                setSecret(null);
            } else {
                setError(data.error || 'Código inválido.');
            }
        } catch (err) {
            setError('Erro ao verificar código.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h1>Meu Perfil</h1>
                <p>Gerencie suas informações e segurança da conta</p>
            </div>

            <div className="profile-section">
                <h2>Informações Pessoais</h2>
                {/* Placeholder for user details */}
                <div className="profile-details">
                    <div className="detail-item">
                        <label>Nome</label>
                        <span>Administrador</span>
                    </div>
                    <div className="detail-item">
                        <label>Email</label>
                        <span>admin@example.com</span>
                    </div>
                </div>
            </div>

            <div className="profile-section">
                <h2>Segurança - Autenticação de Dois Fatores (2FA)</h2>
                <div className="two-factor-content">
                    <div className="two-factor-status">
                        <span className={`status-badge ${is2FAEnabled ? 'enabled' : 'disabled'}`}>
                            Status: {is2FAEnabled ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>

                    {!is2FAEnabled && !qrCode && (
                        <button
                            className="btn-activate"
                            onClick={handleEnable2FA}
                            disabled={loading}
                        >
                            {loading ? 'Carregando...' : 'Ativar 2FA Agora'}
                        </button>
                    )}

                    {qrCode && !is2FAEnabled && (
                        <div className="qr-step">
                            <p>1. Escaneie o QR Code abaixo com seu aplicativo autenticador (Google Authenticator, Authy, etc.):</p>
                            <div className="qr-code-container">
                                <Image src={qrCode} alt="2FA QR Code" width={192} height={192} unoptimized />
                                <p className="secret-text">Se não conseguir escanear, digite este código: <span className="secret-code">{secret}</span></p>
                            </div>

                            <p>2. Digite o código de 6 dígitos gerado pelo aplicativo:</p>
                            <div className="verification-input">
                                <input
                                    type="text"
                                    placeholder="000000"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    maxLength={6}
                                />
                                <button
                                    className="btn-verify"
                                    onClick={handleVerify2FA}
                                    disabled={loading || verificationCode.length !== 6}
                                >
                                    {loading ? 'Verificando...' : 'Verificar e Ativar'}
                                </button>
                            </div>
                        </div>
                    )}

                    {error && <p className="error-message">{error}</p>}
                    {success && <p className="success-message">{success}</p>}
                </div>
            </div>
        </div>
    );
}
