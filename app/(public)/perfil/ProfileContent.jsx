'use client';

import Image from 'next/image';
import { useState } from 'react';
import './perfil.css';

export default function ProfileContent({ user }) {
    const [qrCode, setQrCode] = useState(null);
    const [secret, setSecret] = useState(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [is2FAEnabled, setIs2FAEnabled] = useState(user.twoFactorEnabled);

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
                body: JSON.stringify({ token: verificationCode, password }),
            });
            const data = await res.json();

            if (res.ok) {
                setPassword('');
                setVerificationCode('');
                setSuccess('Autenticação de Dois Fatores ativada. As outras sessões desta conta foram encerradas.');
                setIs2FAEnabled(true);
                setQrCode(null);
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

    const handleDisable2FA = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const res = await fetch('/api/auth/2fa/disable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: verificationCode }),
            });
            const data = await res.json();

            if (res.ok) {
                setSuccess('2FA desativado. As outras sessões desta conta foram encerradas.');
                setIs2FAEnabled(false);
                setVerificationCode('');
            } else {
                setError(data.error || 'Código inválido.');
            }
        } catch (err) {
            setError('Erro de conexão.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-container fade-in">
            <div className="profile-header slide-up">
                <h1>Segurança da Conta</h1>
                <p>Gerencie a verificação em duas etapas (2FA)</p>
            </div>

            <div className="profile-grid">
                <div className="profile-section card slide-up delay-1">
                    <h2>Autenticação de Dois Fatores (2FA)</h2>
                    <div className="two-factor-content">
                        <div className="status-container">
                            <span>Status Atual</span>
                            <span className={`status-badge ${is2FAEnabled ? 'enabled' : 'disabled'}`}>
                                {is2FAEnabled ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>

                        {is2FAEnabled && (
                            <form className="verification-input-group" onSubmit={handleDisable2FA}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    aria-label="Código do aplicativo para desativar o 2FA"
                                    placeholder="000000"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    maxLength={6}
                                    className="code-input"
                                />
                                <button type="submit" className="btn-verify" disabled={loading || verificationCode.length !== 6}>
                                    {loading ? 'Aguarde...' : 'Desativar 2FA'}
                                </button>
                            </form>
                        )}

                        {!is2FAEnabled && !qrCode && (
                            <button
                                className="btn-activate"
                                onClick={handleEnable2FA}
                                disabled={loading}
                            >
                                {loading ? 'Carregando...' : 'Ativar 2FA'}
                            </button>
                        )}

                        {qrCode && !is2FAEnabled && (
                            <div className="qr-step fade-in">
                                <p className="step-instruction">1. Escaneie o QR Code com seu aplicativo autenticador:</p>
                                <div className="qr-code-container">
                                    <Image src={qrCode} alt="2FA QR Code" width={192} height={192} unoptimized />
                                    <p className="secret-text">
                                        Código manual: <span className="secret-code">{secret}</span>
                                    </p>
                                </div>

                                <p className="step-instruction">
                                    2. Digite o código de 6 dígitos{user.hasPassword ? ' e a sua senha' : ''}:
                                </p>
                                <div className="verification-input-group">
                                    {user.hasPassword && (
                                        <input
                                            type="password"
                                            aria-label="Sua senha atual"
                                            placeholder="Sua senha"
                                            autoComplete="current-password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            maxLength={100}
                                            className="code-input"
                                        />
                                    )}
                                    <input
                                        type="text"
                                        placeholder="000000"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        maxLength={6}
                                        className="code-input"
                                    />
                                    <button
                                        className="btn-verify"
                                        onClick={handleVerify2FA}
                                        disabled={loading || verificationCode.length !== 6 || (user.hasPassword && !password)}
                                    >
                                        {loading ? 'Verificando...' : 'Verificar'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {error && <div className="message error fade-in">{error}</div>}
                        {success && <div className="message success fade-in">{success}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
