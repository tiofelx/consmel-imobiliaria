'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import '../admin.css';

const severityOptions = ['all', 'critical', 'high', 'medium', 'low'];
const SECURITY_EVENTS_POLL_MS = 2000;

function severityBadgeColor(severity) {
  if (severity === 'critical') return { bg: '#fee2e2', color: '#991b1b' };
  if (severity === 'high') return { bg: '#ffedd5', color: '#9a3412' };
  if (severity === 'medium') return { bg: '#fef9c3', color: '#854d0e' };
  return { bg: '#dcfce7', color: '#166534' };
}

export default function SegurancaPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 20, totalPages: 1 });
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const hasLoadedRef = useRef(false);
  const [filters, setFilters] = useState({
    severity: 'all',
    ip: '',
    route: '',
    from: '',
    to: '',
    page: 1,
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(filters.page));
    params.set('pageSize', '20');
    if (filters.severity !== 'all') params.set('severity', filters.severity);
    if (filters.ip.trim()) params.set('ip', filters.ip.trim());
    if (filters.route.trim()) params.set('route', filters.route.trim());
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    return params.toString();
  }, [filters]);

  useEffect(() => {
    let isMounted = true;

    async function fetchEvents() {
      if (!hasLoadedRef.current) {
        setLoading(true);
      }
      try {
        const res = await fetch(`/api/security-events?${queryString}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Erro ao buscar eventos');
        const data = await res.json();
        if (!isMounted) return;
        setItems(Array.isArray(data.items) ? data.items : []);
        setPagination(data.pagination || { total: 0, page: 1, pageSize: 20, totalPages: 1 });
        setLastUpdatedAt(new Date());
        hasLoadedRef.current = true;
      } catch {
        if (!isMounted) return;
        setItems([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchEvents();
    const intervalId = setInterval(fetchEvents, SECURITY_EVENTS_POLL_MS);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [queryString]);

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }

  function goToPage(page) {
    setFilters((prev) => ({ ...prev, page }));
  }

  return (
    <>
      <div className="admin-section-header">
        <div className="admin-header-content">
          <h2>Eventos de Seguranca</h2>
          <p>Consulta forense de tentativas, bloqueios, abuso e eventos criticos.</p>
        </div>
      </div>

      <div className="admin-table-container" style={{ marginBottom: '16px', padding: '16px' }}>
        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <label>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Severidade</div>
            <select className="form-select" value={filters.severity} onChange={(e) => updateFilter('severity', e.target.value)}>
              {severityOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>IP</div>
            <input className="form-input" value={filters.ip} onChange={(e) => updateFilter('ip', e.target.value)} placeholder="127.0.0.1" />
          </label>

          <label>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Rota</div>
            <input className="form-input" value={filters.route} onChange={(e) => updateFilter('route', e.target.value)} placeholder="/api/auth/login" />
          </label>

          <label>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>De</div>
            <input className="form-input" type="datetime-local" value={filters.from} onChange={(e) => updateFilter('from', e.target.value)} />
          </label>

          <label>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Ate</div>
            <input className="form-input" type="datetime-local" value={filters.to} onChange={(e) => updateFilter('to', e.target.value)} />
          </label>
        </div>
      </div>

      <div className="admin-table-container">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Evento</th>
              <th>Severidade</th>
              <th>IP</th>
              <th>Rota</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8' }}>Carregando eventos...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8' }}>Nenhum evento encontrado para os filtros atuais.</td>
              </tr>
            ) : (
              items.map((item) => {
                const badge = severityBadgeColor(item.severity);
                return (
                  <tr key={item.id}>
                    <td>{new Date(item.createdAt).toLocaleString('pt-BR')}</td>
                    <td>{item.event}</td>
                    <td>
                      <span style={{ padding: '4px 8px', borderRadius: '999px', background: badge.bg, color: badge.color, fontWeight: 600, fontSize: '0.75rem' }}>
                        {item.severity}
                      </span>
                    </td>
                    <td>{item.ip}</td>
                    <td>{item.route || 'unknown'}</td>
                    <td>{item.reason || 'unspecified'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
          Total: {pagination.total} evento(s)
          {lastUpdatedAt ? ` • Atualizado às ${lastUpdatedAt.toLocaleTimeString('pt-BR')}` : ''}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-secondary"
            onClick={() => goToPage(Math.max(1, pagination.page - 1))}
            disabled={pagination.page <= 1}
            style={{ opacity: pagination.page <= 1 ? 0.5 : 1 }}
          >
            Anterior
          </button>
          <button
            className="btn-secondary"
            onClick={() => goToPage(Math.min(pagination.totalPages, pagination.page + 1))}
            disabled={pagination.page >= pagination.totalPages}
            style={{ opacity: pagination.page >= pagination.totalPages ? 0.5 : 1 }}
          >
            Proxima
          </button>
        </div>
      </div>
    </>
  );
}
