import Link from 'next/link';
import Image from 'next/image';
import { verifySession } from '@/lib/auth';
import AdminSidebar from '@/app/components/admin/AdminSidebar';
import AdminNavLinks from '@/app/components/admin/AdminNavLinks';
import AdminMobileMenu from '@/app/components/admin/AdminMobileMenu';
import LogoutButton from '@/app/components/admin/LogoutButton';
import GlobalHackerAlerts from '@/app/components/admin/GlobalHackerAlerts';
import './admin.css';

export default async function AdminLayout({ children }) {
  const session = await verifySession();
  const userName = session?.name || 'Admin';

  return (
    <div className="admin-container">
      <GlobalHackerAlerts />
      {/* Full Width Admin Header */}
      <header className="admin-header">
        <div className="admin-mobile-menu-anchor">
          <AdminMobileMenu>
            <AdminNavLinks />
          </AdminMobileMenu>
        </div>

        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" className="header-logo-link" style={{ width: '180px', height: '65px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Image
              src="/images/logo.png"
              alt="Consmel Imobiliária"
              width={180}
              height={65}
              priority
              style={{ objectFit: 'contain' }}
            />
          </Link>
        </div>
        <div className="header-right">
          <div className="admin-user-profile">
            <div className="admin-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
            {/* 
            <Image
              src="/favicon.png"
              alt="Admin"
              width={42}
              height={42}
              className="admin-avatar-img"
            />
            */}

          </div>
          <LogoutButton />
        </div>
      </header>

      <div className="admin-body">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content Area */}
        <main className="admin-main">
          {/* Content */}
          <div className="admin-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
