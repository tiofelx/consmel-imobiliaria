'use client';

import { useState, useEffect, useRef } from 'react';
import './GlobalHackerAlerts.css';

const ALERT_POLL_INTERVAL_MS = 1000;

export default function GlobalHackerAlerts() {
    const [alerts, setAlerts] = useState([]);
    const lastSyncRef = useRef(null);

    useEffect(() => {
        // Initial sync time point to avoid showing past alerts on mount
        lastSyncRef.current = new Date().toISOString();

        const fetchAlerts = async () => {
            try {
                // Only ask for alerts newer than our last sync point
                const url = new URL('/api/admin/alerts/live', window.location.origin);
                if (lastSyncRef.current) {
                    url.searchParams.append('since', lastSyncRef.current);
                }

                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    if (data.alerts && data.alerts.length > 0) {
                        setAlerts(prev => {
                            // Prevent duplicates if network is slow
                            const newAlerts = data.alerts.filter(a => !prev.some(p => p.id === a.id));
                            return [...prev, ...newAlerts];
                        });
                    }
                }

                // Update sync time without triggering re-render
                lastSyncRef.current = new Date().toISOString();
            } catch (err) {
                // Ignore connection errors silently to not annoy admins
            }
        };

        fetchAlerts();

        // Poll every 1 second
        const intervalId = setInterval(fetchAlerts, ALERT_POLL_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, []);

    const dismissAlert = (id) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    };

    if (alerts.length === 0) return null;

    return (
        <div className="global-hacker-alerts-container">
            {alerts.map(alert => (
                <div key={alert.id} className="admin-hacker-alert-modal">
                    <div className="admin-hacker-alert-header">
                        <span className="admin-hacker-icon">⚠️</span>
                        <h3 className="admin-hacker-title">ALERTA DE SEGURANÇA</h3>
                    </div>
                    <div className="admin-hacker-alert-body">
                        <p><strong>Origem:</strong> {alert.source}</p>
                        <p><strong>IP:</strong> {alert.ip === '::1' ? 'localhost (::1)' : alert.ip.replace('::ffff:', '')}</p>
                        <p><strong>Motivo:</strong> {alert.reason}</p>
                        <p className="admin-hacker-message">{alert.message}</p>
                    </div>
                    <button className="admin-hacker-btn" onClick={() => dismissAlert(alert.id)}>
                        Descartar Alerta
                    </button>
                </div>
            ))}
        </div>
    );
}
