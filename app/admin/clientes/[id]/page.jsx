'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import './page.css';
import AdminHeader from '@/app/components/admin/AdminHeader';
import FormStepper from '@/app/components/admin/FormStepper';

export default function EditClient({ params }) {
    const { id } = useParams(); // Changed from `use(params)` to `useParams()`
    const router = useRouter();

    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    // Form state
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', interest: 'Compra', status: 'Novo', notes: ''
    });

    useEffect(() => {
        fetch(`/api/clients/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Not found');
                return res.json();
            })
            .then(data => {
                setClient(data);
                setFormData({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    interest: data.interest || 'Compra',
                    status: data.status || 'Novo',
                    notes: data.notes || '',
                });
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/clients/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                router.push('/admin/clientes');
            } else {
                alert('Erro ao salvar alterações.');
            }
        } catch {
            alert('Erro ao salvar alterações.');
        }
        setIsSaving(false);
    };

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
        const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
        if (res.ok) {
            router.push('/admin/clientes');
        }
    };

    if (loading) {
        return <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Carregando...</div>;
    }

    if (!client) {
        return <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Cliente não encontrado.</div>;
    }

    return (
        <>
            <AdminHeader
                title={`Editar: ${formData.name}`}
                subtitle="Atualize as informações do cliente e status do lead."
                backLink="/admin/clientes"
                backLinkText="Clientes"
                breadcrumbTitle="Editar"
            />

            <div className="admin-stepper-container admin-stepper-form">

                <div style={{ maxWidth: '300px', margin: '0 auto 40px' }}>
                    <FormStepper
                        steps={[
                            { label: 'Dados Pessoais' },
                            { label: 'Lead & Notas' }
                        ]}
                        currentStep={currentStep}
                    />
                </div>

                {/* Step 1: Contact Info */}
                {currentStep === 1 && (
                    <div>
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <h4 className="form-section-title" style={{ marginTop: 0 }}>Informações de Contato</h4>
                        </div>
                        <div className="form-grid">
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">Nome Completo</label>
                                <div className="input-wrapper">
                                    <input type="text" className="form-input" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                </div>
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">E-mail</label>
                                <div className="input-wrapper">
                                    <input type="email" className="form-input" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Telefone</label>
                                <div className="input-wrapper">
                                    <input type="tel" className="form-input" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Lead Details */}
                {currentStep === 2 && (
                    <div>
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <h4 className="form-section-title" style={{ marginTop: 0 }}>Detalhes do Lead</h4>
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Interesse</label>
                                <select className="form-select" value={formData.interest} onChange={(e) => handleChange('interest', e.target.value)}>
                                    <option value="Compra">Compra</option>
                                    <option value="Aluguel">Aluguel</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select className="form-select" value={formData.status} onChange={(e) => handleChange('status', e.target.value)}>
                                    <option value="Novo">Novo</option>
                                    <option value="Em Negociação">Em Negociação</option>
                                    <option value="Visita Agendada">Visita Agendada</option>
                                    <option value="Arquivado">Arquivado</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">Notas / Observações</label>
                                <textarea className="form-textarea" rows="6" placeholder="Adicione observações sobre este cliente..." value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)}></textarea>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="form-actions">
                    {currentStep > 1 ? (
                        <button onClick={prevStep} className="nav-btn prev-btn">Voltar</button>
                    ) : (
                        <Link href="/admin/clientes" className="nav-btn prev-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Cancelar</Link>
                    )}

                    {currentStep === 2 && (
                        <button className="nav-btn btn-danger" style={{ marginRight: 'auto', marginLeft: '12px' }} onClick={handleDelete}>
                            Excluir
                        </button>
                    )}

                    {currentStep < 2 ? (
                        <button onClick={nextStep} className="nav-btn next-btn" style={{ marginLeft: currentStep === 1 ? 'auto' : 0 }}>Próximo</button>
                    ) : (
                        <button className="nav-btn next-btn" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
