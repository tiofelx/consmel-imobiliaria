'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import '../admin.css';

export default function AlertasPage() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'resolved'

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const res = await fetch('/api/alerts', { cache: 'no-store' });
            const data = await res.json();
            setAlerts(data);
        } catch {
            console.error('Erro ao buscar alertas');
        } finally {
            setLoading(false);
        }
    };

    const resolveAlert = async (id) => {
        try {
            await fetch(`/api/alerts/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resolved: true }),
            });
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
        } catch {
            alert('Erro ao resolver alerta.');
        }
    };

    const filtered = alerts.filter(a => {
        if (filter === 'pending') return !a.resolved;
        if (filter === 'resolved') return a.resolved;
        return true;
    });

    const pendingCount = alerts.filter(a => !a.resolved).length;

    const severityIcon = (severity) => {
        switch (severity) {
            case 'high': return '🔴';
            case 'medium': return '🟡';
            case 'low': return '🟢';
            default: return '⚪';
        }
    };

    const typeLabel = (type) => {
        switch (type) {
            case 'fraud': return 'Possível Fraude';
            case 'suspicious_password': return 'Senha Suspeita';
            case 'ddd_mismatch': return 'DDD Inconsistente';
            case 'location_mismatch': return 'Local Inconsistente';
            default: return type;
        }
    };

    const sourceLabel = (source) => {
        switch (source) {
            case 'register': return 'Cadastro (Login)';
            case 'cadastro-imovel': return 'Cadastro de Imóvel';
            default: return source;
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                Carregando alertas...
            </div>
        );
    }

    return (
        <div className="admin-content">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                        🛡️ Alertas de Segurança
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                        {pendingCount > 0 ? `${pendingCount} alerta${pendingCount > 1 ? 's' : ''} pendente${pendingCount > 1 ? 's' : ''}` : 'Nenhum alerta pendente'}
                    </p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {[
                    { key: 'all', label: `Todos (${alerts.length})` },
                    { key: 'pending', label: `Pendentes (${pendingCount})` },
                    { key: 'resolved', label: `Resolvidos (${alerts.length - pendingCount})` },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            background: filter === tab.key ? '#e85d2f' : '#f3f4f6',
                            color: filter === tab.key ? 'white' : '#6b7280',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Alert Cards */}
            {filtered.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 20px', color: '#9ca3af',
                    background: '#f9fafb', borderRadius: '12px', border: '1px dashed #e5e7eb'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
                    <p style={{ fontWeight: 500 }}>Tudo limpo! Nenhum alerta encontrado.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filtered.map(alert => (
                        <div
                            key={alert.id}
                            style={{
                                background: alert.resolved ? '#f9fafb' : 'white',
                                border: `1px solid ${alert.resolved ? '#e5e7eb' : alert.severity === 'high' ? '#fecaca' : '#fde68a'}`,
                                borderRadius: '12px',
                                padding: '16px 20px',
                                opacity: alert.resolved ? 0.7 : 1,
                                transition: 'all 0.3s ease',
                            }}
                        >
                            {/* Alert Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '1.2rem' }}>{severityIcon(alert.severity)}</span>
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>
                                            {typeLabel(alert.type)}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                                            {sourceLabel(alert.source)} • {new Date(alert.createdAt).toLocaleString('pt-BR')}
                                        </div>
                                    </div>
                                </div>
                                {!alert.resolved && (
                                    <button
                                        onClick={() => resolveAlert(alert.id)}
                                        style={{
                                            padding: '6px 14px', borderRadius: '6px', border: '1px solid #e5e7eb',
                                            background: 'white', cursor: 'pointer', fontSize: '0.8rem',
                                            fontWeight: 600, color: '#374151', transition: 'all 0.2s',
                                        }}
                                        onMouseOver={(e) => { e.target.style.background = '#f3f4f6'; }}
                                        onMouseOut={(e) => { e.target.style.background = 'white'; }}
                                    >
                                        ✓ Resolver
                                    </button>
                                )}
                                {alert.resolved && (
                                    <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>
                                        ✓ Resolvido
                                    </span>
                                )}
                            </div>

                            {/* Alert Details */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                                {alert.name && (
                                    <div style={{ fontSize: '0.85rem' }}>
                                        <span style={{ color: '#9ca3af' }}>Nome: </span>
                                        <span style={{ color: '#111827', fontWeight: 500 }}>{alert.name}</span>
                                    </div>
                                )}
                                {alert.email && (
                                    <div style={{ fontSize: '0.85rem' }}>
                                        <span style={{ color: '#9ca3af' }}>Email: </span>
                                        <span style={{ color: '#111827', fontWeight: 500 }}>{alert.email}</span>
                                    </div>
                                )}
                                {alert.phone && (
                                    <div style={{ fontSize: '0.85rem' }}>
                                        <span style={{ color: '#9ca3af' }}>Tel: </span>
                                        <span style={{ color: '#111827', fontWeight: 500 }}>{alert.phone}</span>
                                    </div>
                                )}
                                {alert.address && (
                                    <div style={{ fontSize: '0.85rem' }}>
                                        <span style={{ color: '#9ca3af' }}>End: </span>
                                        <span style={{ color: '#111827', fontWeight: 500 }}>{alert.address}</span>
                                    </div>
                                )}
                            </div>

                            {/* Reasons */}
                            {alert.reasons && alert.reasons.length > 0 && (
                                <div style={{
                                    background: alert.severity === 'high' ? '#fef2f2' : '#fffbeb',
                                    padding: '10px 14px', borderRadius: '8px', fontSize: '0.83rem',
                                }}>
                                    <strong style={{ color: alert.severity === 'high' ? '#dc2626' : '#d97706' }}>Motivos:</strong>
                                    <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                        {alert.reasons.map((r, i) => (
                                            <li key={i} style={{ color: '#374151', marginBottom: '2px' }}>{r}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
