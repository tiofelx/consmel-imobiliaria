import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import '../clientes/page.css';

export default async function AdminLeads() {
    // Antes da consulta: sem sessão de admin nada é lido (e a página não é pré-gerada no build).
    await requireAdmin();
    const leads = await prisma.lancamentoLead.findMany({ orderBy: { createdAt: 'desc' } });

    return (
        <>
            <div className="admin-section-header">
                <div className="admin-header-content">
                    <h2>Leads do Lançamento</h2>
                    <p>Cadastros feitos na página de lançamento.</p>
                </div>
            </div>

            <div className="admin-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>E-mail</th>
                            <th>WhatsApp</th>
                            <th>Data de Cadastro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Nenhum lead ainda.</td></tr>
                        ) : (
                            leads.map((lead) => (
                                <tr key={lead.id}>
                                    <td>{lead.name}</td>
                                    <td><a href={`mailto:${lead.email}`}>{lead.email}</a></td>
                                    <td>
                                        <a href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                                            {lead.phone}
                                        </a>
                                    </td>
                                    <td>{lead.createdAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
