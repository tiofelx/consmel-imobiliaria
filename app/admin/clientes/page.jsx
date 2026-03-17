'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import './page.css';

export default function AdminClients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/clients', { cache: 'no-store' })
            .then(res => {
                if (!res.ok) throw new Error('Erro ao buscar clientes');
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setClients(data);
                } else {
                    console.error('API returned non-array:', data);
                    setClients([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching clients:', err);
                setClients([]);
                setLoading(false);
            });
    }, []);

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

        const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setClients(prev => prev.filter(c => c.id !== id));
        }
    };

    return (
        <>
            <div className="admin-section-header">
                <div className="admin-header-content">
                    <h2>Gerenciar Clientes</h2>
                    <p>Visualize e gerencie seus contatos e leads.</p>
                </div>
            </div>

            <div className="admin-table-container">
                <table>
                    <colgroup>
                        <col style={{ width: '25%' }} />
                        <col style={{ width: '25%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '10%' }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Contato</th>
                            <th>Interesse</th>
                            <th>Data de Cadastro</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Carregando...</td></tr>
                        ) : clients.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Nenhum cliente cadastrado ainda.</td></tr>
                        ) : (
                            clients.map(client => (
                                <tr key={client.id}>
                                    <td>
                                        <div style={{ fontWeight: 600, color: '#111827' }}>{client.name}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.9rem', color: '#374151' }}>{client.email}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '2px' }}>{client.phone || '—'}</div>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '2px 8px',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            backgroundColor: client.interest === 'Compra' ? '#dbeafe' : '#fce7f3',
                                            color: client.interest === 'Compra' ? '#1e40af' : '#9d174d'
                                        }}>
                                            {client.interest}
                                        </span>
                                    </td>
                                    <td style={{ color: '#4b5563', fontSize: '0.9rem' }}>
                                        {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${client.status === 'Novo' ? 'status-active' :
                                            client.status === 'Arquivado' ? 'status-inactive' : 'status-draft'
                                            }`}>
                                            {client.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <Link href={`/admin/clientes/${client.id}`} className="action-btn" title="Editar" style={{ marginRight: '8px', display: 'inline-flex' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </Link>
                                        <button className="action-btn" title="Excluir" style={{ color: '#ef4444' }} onClick={() => handleDelete(client.id)}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
