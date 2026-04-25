'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { validateEmail, validatePhone, maskPhone, validatePassword, getPasswordStrengthLabel, detectFraud } from '@/lib/validations';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './login.css';

function LoginForm() {
    const searchParams = useSearchParams();
    const is2FAPage = searchParams.get('action') === '2fa';
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState(null);
    const [is2FARequired, setIs2FARequired] = useState(is2FAPage);
    const [token, setToken] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const error = searchParams.get('error');

        if (error) {
            const errorMap = {
                oauth_error: 'Erro na autenticação com Google.',
                missing_params: 'Parâmetros inválidos.',
                invalid_state: 'Sessão inválida. Tente novamente.',
                token_error: 'Erro ao validar token do Google.',
                user_info_error: 'Erro ao obter dados do usuário.',
                server_error: 'Erro interno no servidor.',
            };
            alert(errorMap[error] || 'Ocorreu um erro no login.');
        }
    }, [searchParams]);

    // Force scroll to top on mount and prevent browser scroll restoration
    useEffect(() => {
        // Disable browser's automatic scroll restoration
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        // Force scroll to top
        window.scrollTo(0, 0);

        // Re-enable scroll restoration when component unmounts
        return () => {
            if ('scrollRestoration' in history) {
                history.scrollRestoration = 'auto';
            }
        };
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Auto-mask phone
        if (name === 'phone') {
            setFormData(prev => ({ ...prev, phone: maskPhone(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        // Password strength check
        if (name === 'password') {
            const result = validatePassword(value);
            setPasswordStrength(value ? result : null);
        }
        // Clear error on edit
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Special handling for OAuth 2FA (no email/pass needed, just token)
        if (is2FAPage) {
            setIsLoading(true);
            try {
                const res2fa = await fetch('/api/auth/2fa/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });
                const data2fa = await res2fa.json();
                setIsLoading(false);
                
                if (res2fa.ok) {
                    window.location.href = data2fa.redirectUrl || '/admin';
                } else {
                    alert(data2fa.error || 'Código inválido.');
                }
            } catch (error) {
                setIsLoading(false);
                alert('Erro ao verificar código.');
            }
            return;
        }

        if (isLogin) {
            setIsLoading(true);
            // Login validation
            const errors = {};
            const emailResult = validateEmail(formData.email);
            if (!emailResult.valid) errors.email = emailResult.message;
            if (!formData.password) errors.password = 'Senha é obrigatória.';

            if (Object.keys(errors).length > 0) {
                setFieldErrors(errors);
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password,
                        token: is2FARequired ? token : undefined, // Send token if required
                    }),
                });

                const data = await res.json();
                console.log('DEBUG LOGIN CLIENT: Response data:', data);
                setIsLoading(false);

                if (res.ok) {
                    // Check if 2FA is required
                    if (data.require2fa) {
                        setIs2FARequired(true);
                        setToken(''); // Reset token input
                        alert(data.message || 'Digite o código de verificação 2FA.');
                        return;
                    }

                    // Redirect based on role
                    if (data.user?.role === 'ADMIN') {
                        window.location.href = '/admin';
                    } else {
                        window.location.href = '/';
                    }
                } else {
                    alert(data.error || 'Erro ao realizar login.');
                }
            } catch (error) {
                setIsLoading(false);
                alert('Erro de conexão ao realizar login.');
            }
        } else {
            // Registration validation
            const errors = {};
            if (!formData.name || formData.name.trim().length < 3) {
                errors.name = 'Nome completo é obrigatório (mínimo 3 caracteres).';
            }
            const emailResult = validateEmail(formData.email);
            if (!emailResult.valid) errors.email = emailResult.message;
            const phoneResult = validatePhone(formData.phone);
            if (!phoneResult.valid) errors.phone = phoneResult.message;
            const passResult = validatePassword(formData.password);
            if (!passResult.valid) {
                errors.password = passResult.message;
                if (passResult.suspicious) {
                    // Suspicious password — create alert
                    try {
                        await fetch('/api/alerts', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                type: 'suspicious_password',
                                severity: 'high',
                                source: 'register',
                                name: formData.name,
                                email: formData.email,
                                phone: formData.phone,
                                reasons: ['Senha suspeita detectada: possível tentativa de injection'],
                            }),
                        });
                    } catch { /* silent */ }
                }
            }
            if (formData.password !== formData.confirmPassword) {
                errors.confirmPassword = 'As senhas não coincidem.';
            }

            if (Object.keys(errors).length > 0) {
                setFieldErrors(errors);
                return;
            }

            setIsLoading(true);

            // Fraud detection
            const fraud = detectFraud({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
            });

            if (fraud.suspicious) {
                try {
                    await fetch('/api/alerts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'fraud',
                            severity: fraud.severity,
                            source: 'register',
                            name: formData.name,
                            email: formData.email,
                            phone: formData.phone,
                            reasons: fraud.reasons,
                        }),
                    });
                } catch { /* silent */ }
            }

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        password: formData.password, // Send password to backend
                    }),
                });

                const data = await res.json();
                setIsLoading(false);

                if (res.ok) {
                    alert('Cadastro realizado com sucesso! Você será redirecionado.');
                    // Auto-login happens in backend, so just redirect
                    window.location.href = '/admin';
                } else {
                    alert(data.error || 'Erro ao realizar cadastro.');
                }
            } catch {
                setIsLoading(false);
                alert('Erro ao realizar cadastro. Tente novamente.');
            }
        }
    };


    const toggleForm = () => {
        setIsLogin(!isLogin);
        setFormData({
            name: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: ''
        });
    };

    return (
        <>
            <Header />
            <main className="login-page">
                <div className="login-container">
                    {/* Left side - Branding */}
                    <div className="login-branding">
                        <div className="branding-content">
                            <Image
                                src="/images/form-login.svg"
                                alt="Consmel Imobiliária"
                                width={180}
                                height={180}
                                className="login-logo"
                            />
                            <h1>Bem-vindo à<br />Consmel</h1>
                            <div className="branding-features">
                                <div className="feature-item">
                                    <div className="feature-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                            <path d="m9 12 2 2 4-4"></path>
                                        </svg>
                                    </div>
                                    <div className="feature-text">
                                        <h3>Segurança</h3>
                                        <p>Documentação verificada e processo 100% seguro</p>
                                    </div>
                                </div>
                                <div className="feature-item">
                                    <div className="feature-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12 6 12 12 16 14"></polyline>
                                        </svg>
                                    </div>
                                    <div className="feature-text">
                                        <h3>Agilidade</h3>
                                        <p>Atendimento rápido e processos otimizados</p>
                                    </div>
                                </div>
                                <div className="feature-item">
                                    <div className="feature-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                    </div>
                                    <div className="feature-text">
                                        <h3>Atendimento Personalizado</h3>
                                        <p>Consultores dedicados às suas necessidades</p>
                                    </div>
                                </div>
                                <div className="feature-item">
                                    <div className="feature-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                        </svg>
                                    </div>
                                    <div className="feature-text">
                                        <h3>Qualidade</h3>
                                        <p>Imóveis selecionados com critério e cuidado</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right side - Form */}
                    <div className="login-form-container">
                        <div className="form-wrapper" key={isLogin ? 'login' : 'register'}>
                            <div className="form-header">
                                <div className="mobile-logo-container" style={{ display: 'none', marginBottom: '20px', justifyContent: 'center' }}>
                                    <Image
                                        src="/images/logo.png"
                                        alt="Consmel Imobiliária"
                                        width={150}
                                        height={55}
                                        style={{ objectFit: 'contain' }}
                                    />
                                </div>
                                <h2>{is2FAPage ? 'Verificação de Segurança' : (isLogin ? 'Entrar' : 'Criar Conta')}</h2>
                                <p>{is2FAPage ? 'Digite o código do seu aplicativo autenticador.' : (isLogin ? 'Acesse sua conta para gerenciar seus imóveis' : 'Preencha seus dados para se cadastrar')}</p>
                            </div>

                            {!is2FAPage && (
                                <>
                                    <div className="social-login social-login-primary">
                                        <a href="/api/auth/google" className="social-btn google" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                            Continuar com Google
                                        </a>
                                        <p className="social-login-hint">
                                            {isLogin ? 'Acesso rápido — sem precisar criar uma senha' : 'Cadastro instantâneo com sua conta Google'}
                                        </p>
                                    </div>

                                    <div className="form-divider">
                                        <span>ou {isLogin ? 'entre com seu e-mail' : 'cadastre-se com e-mail'}</span>
                                    </div>
                                </>
                            )}

                            <form onSubmit={handleSubmit} className="login-form">
                                {is2FAPage ? (
                                     /* Only show 2FA input for OAuth flow */
                                     <div className="form-group">
                                        <label htmlFor="token">Código 2FA</label>
                                        <div className="input-wrapper">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                            </svg>
                                            <input
                                                type="text"
                                                id="token"
                                                name="token"
                                                value={token}
                                                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                placeholder="000000"
                                                maxLength={6}
                                                required
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                ) : (
                                /* Normal Login Form Content */
                                <>
                                {!isLogin && (
                                    <div className="form-group">
                                        <label htmlFor="name">Nome completo</label>
                                        <div className="input-wrapper">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="12" cy="7" r="4"></circle>
                                            </svg>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Seu nome completo"
                                                required={!isLogin}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label htmlFor="email">E-mail</label>
                                    <div className="input-wrapper">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                            <polyline points="22,6 12,13 2,6"></polyline>
                                        </svg>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="seu@email.com"
                                            required
                                        />
                                    </div>
                                    {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                                </div>

                                {!isLogin && (
                                    <div className="form-group">
                                        <label htmlFor="phone">Telefone</label>
                                        <div className="input-wrapper">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                            </svg>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="(31) 99999-9999"
                                                required={!isLogin}
                                            />
                                        </div>
                                        {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
                                    </div>
                                )}

                                <div className="form-group">
                                    <label htmlFor="password">Senha</label>
                                    <div className="input-wrapper">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                        </svg>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="Sua senha"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="toggle-password"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                    <circle cx="12" cy="12" r="3"></circle>
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
                                    {!isLogin && passwordStrength && (
                                        <div className="password-strength">
                                            <div className="strength-bars">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <div
                                                        key={i}
                                                        className="strength-bar"
                                                        style={{ background: i <= passwordStrength.strength ? getPasswordStrengthLabel(passwordStrength.strength).color : '#e5e7eb' }}
                                                    />
                                                ))}
                                            </div>
                                            <span className="strength-label" style={{ color: getPasswordStrengthLabel(passwordStrength.strength).color }}>
                                                {getPasswordStrengthLabel(passwordStrength.strength).text}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {!isLogin && (
                                    <div className="form-group">
                                        <label htmlFor="confirmPassword">Confirmar Senha</label>
                                        <div className="input-wrapper">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                            </svg>
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                placeholder="Confirme sua senha"
                                                required={!isLogin}
                                            />
                                            <button
                                                type="button"
                                                className="toggle-password"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                        <circle cx="12" cy="12" r="3"></circle>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        {fieldErrors.confirmPassword && <span className="field-error">{fieldErrors.confirmPassword}</span>}
                                    </div>
                                )}

                                {isLogin && (
                                    <div className="form-options">
                                        <label className="remember-me">
                                            <input type="checkbox" />
                                            <span>Lembrar de mim</span>
                                        </label>
                                        <Link href="/esqueci-senha" className="forgot-password">
                                            Esqueceu a senha?
                                        </Link>
                                    </div>
                                )}

                                {is2FARequired && (
                                    <div className="form-group">
                                        <label htmlFor="token">Código 2FA</label>
                                        <div className="input-wrapper">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                            </svg>
                                            <input
                                                type="text"
                                                id="token"
                                                name="token"
                                                value={token}
                                                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                placeholder="000000"
                                                maxLength={6}
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                </>
                                )}

                                <button type="submit" className="submit-btn" disabled={isLoading}>
                                    {isLoading ? (
                                        <span className="loading-spinner"></span>
                                    ) : (
                                        is2FAPage ? 'Verificar' : (isLogin ? (is2FARequired ? 'Verificar' : 'Entrar') : 'Criar Conta')
                                    )}
                                </button>
                            </form>

                            <div className="form-footer">
                                <p>
                                    {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                                    <button type="button" onClick={toggleForm} className="toggle-form-btn">
                                        {isLogin ? 'Cadastre-se' : 'Entrar'}
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="login-loading">Carregando...</div>}>
            <LoginForm />
        </Suspense>
    );
}
