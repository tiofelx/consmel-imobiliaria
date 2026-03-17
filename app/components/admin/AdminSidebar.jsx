'use client';

import AdminNavLinks from './AdminNavLinks';
import './AdminSidebar.css';

export default function AdminSidebar() {
    return (
        <aside className="admin-sidebar">
            <AdminNavLinks />
        </aside>
    );
}
