'use client';

import { useRouter } from 'next/navigation';
import './LogoutButton.css';

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Logout failed', error);
            // Fallback redirect even if fetch fails
            router.push('/login');
        }
    };

    return (
        <button onClick={handleLogout} className="header-logout-btn" title="Sair" style={{ cursor: 'pointer', background: 'transparent' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span className="logout-label">Sair</span>
        </button>
    );
}
