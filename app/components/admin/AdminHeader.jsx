import React from 'react';
import Link from 'next/link';
import './AdminHeader.css';

const AdminHeader = ({ title, subtitle, backLink, backLinkText = 'Voltar', action, breadcrumbTitle }) => {
    return (
        <div className="section-header">
            <div className="header-content">
                {backLink && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--admin-text-secondary)', fontSize: '0.875rem' }}>
                        <Link href={backLink} style={{ color: 'inherit', textDecoration: 'none' }}>{backLinkText}</Link>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                        <span>{breadcrumbTitle || title}</span>
                    </div>
                )}
                <h2>{title}</h2>
                {subtitle && <p>{subtitle}</p>}
            </div>
            {action && (
                <div>
                    {action}
                </div>
            )}
        </div>
    );
};

export default AdminHeader;
