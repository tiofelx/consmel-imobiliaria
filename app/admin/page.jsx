import Link from 'next/link';
import { verifySession } from '@/lib/auth';
import './page.css';
import prisma from '@/lib/prisma';

// Helper functions
const getGreeting = () => {
  const hour = Number(
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      hour12: false,
    }).format(new Date())
  );
  if (hour < 12) return 'Bom dia';
  if (hour < 19) return 'Boa tarde';
  return 'Boa noite';
};

const getCurrentDate = () => {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
};

async function getStats() {
  try {
    const [
      totalProperties,
      saleProperties,
      rentProperties,
      totalClients,
      recentProperties
    ] = await Promise.all([
      prisma.property.count(),
      prisma.property.count({ where: { transactionType: 'Venda' } }),
      prisma.property.count({ where: { transactionType: 'Aluguel' } }),
      prisma.client.count(),
      prisma.property.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      })
    ]);

    return {
      totalProperties,
      saleProperties,
      rentProperties,
      totalClients,
      recentProperties,
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      totalProperties: 0,
      saleProperties: 0,
      rentProperties: 0,
      totalClients: 0,
      recentProperties: [],
    };
  }
}

export default async function AdminDashboard() {
  const session = await verifySession();
  const userName = session?.name || 'Admin';
  const stats = await getStats();

  return (
    <>
      <div className="admin-section-header">
        <div className="admin-header-content">
          <h2>{getGreeting()}, {userName}!</h2>
          <p>Visão geral do sistema e estatísticas de hoje, {getCurrentDate()}.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total de Imóveis</span>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)', color: '#ea580c' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
            </div>
          </div>
          <div className="stat-value">{stats.totalProperties}</div>
          <div className="stat-change">
            <span style={{ color: '#94a3b8' }}>imóveis cadastrados</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Imóveis à Venda</span>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', color: '#2563eb' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
            </div>
          </div>
          <div className="stat-value">{stats.saleProperties}</div>
          <div className="stat-change">
            <span style={{ color: '#94a3b8' }}>para venda</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Imóveis para Aluguel</span>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', color: '#059669' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </div>
          </div>
          <div className="stat-value">{stats.rentProperties}</div>
          <div className="stat-change">
            <span style={{ color: '#94a3b8' }}>para aluguel</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Novos Leads</span>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)', color: '#7c3aed' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
          </div>
          <div className="stat-value">{stats.totalClients}</div>
          <div className="stat-change">
            <span style={{ color: '#94a3b8' }}>clientes cadastrados</span>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <div className="table-header">
          <h3 className="table-title">Imóveis Adicionados Recentemente</h3>
          <Link href="/admin/imoveis" className="btn-header-action">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <polyline points="19 12 12 19 5 12"></polyline>
            </svg>
            Ver Todos
          </Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Localização</th>
              <th>Valor</th>
              <th>Tipo</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentProperties.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Nenhum imóvel cadastrado ainda.</td></tr>
            ) : (
              stats.recentProperties.map(property => (
                <tr key={property.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{property.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>Cadastrado em: {new Date(property.createdAt).toLocaleDateString('pt-BR')}</div>
                  </td>
                  <td>
                    <div style={{ color: '#64748b' }}>
                      {[property.neighborhood, property.city, property.state].filter(Boolean).join(', ') || '—'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.price)}
                    </div>
                  </td>
                  <td style={{ color: '#64748b' }}>{property.category}</td>
                  <td>
                    <span className={`status-badge ${property.transactionType === 'Venda' ? 'status-active' : 'status-pending'}`}>
                      {property.transactionType}
                    </span>
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
