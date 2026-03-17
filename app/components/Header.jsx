'use client';

import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';
import './Header.css';

import { usePathname } from 'next/navigation';

export default function Header({ user }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  // Determine header class based on style state
  const getHeaderClass = () => {
    if (!isHome) return 'header-solid';
    return 'header-solid-home';
  };

  return (
    <header
      className={`header ${getHeaderClass()}`}
      style={{ opacity: 1, pointerEvents: 'auto' }}
    >
      <div className="container header-container">
        {/* Logo */}
        <Link href="/" className="header-logo">
          <Image
            src="/images/logo.png"
            alt="Consmel Imobiliária"
            width={320}
            height={115}
            priority
            className="logo-image"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-desktop">
          <Link href="/cadastro-imovel" className="nav-link">Cadastre seu Imóvel</Link>
          <Link href="/servicos" className="nav-link">Serviços</Link>
          <Link href="/sobre" className="nav-link">Sobre</Link>

          {user ? (
            <div className="user-menu-container" style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="nav-link"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <span>{user.role === 'ADMIN' ? `Olá, ${user.name?.split(' ')[0]}` : user.name?.split(' ')[0]}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {userMenuOpen && (
                <div className="user-dropdown" style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  background: 'white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  padding: '8px 0',
                  minWidth: '150px',
                  zIndex: 1000,
                  marginTop: '8px'
                }}>
                  {user.role === 'ADMIN' && (
                    <>
                      <Link href="/admin" className="dropdown-item" style={{ display: 'block', padding: '8px 16px', color: '#333', textDecoration: 'none' }}>
                        Painel Admin
                      </Link>
                      <Link href="/perfil" className="dropdown-item" style={{ display: 'block', padding: '8px 16px', color: '#333', textDecoration: 'none' }}>
                        Configurar 2FA
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="dropdown-item"
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 16px',
                      color: '#ef4444',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="login-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Login
            </Link>
          )}
        </nav>

        {/* Mobile controls */}
        <div className="mobile-controls">
          {user?.role === 'ADMIN' && (
            <div className="mobile-admin-greeting">
              Olá, {user.name?.split(' ')[0]}
            </div>
          )}

          <button
            className="menu-toggle"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${menuOpen ? 'open' : ''}`}></span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className={`nav-mobile ${menuOpen ? 'open' : ''}`}>
        <Link href="/cadastro-imovel" className="nav-link-mobile" onClick={closeMenu}>Cadastre seu Imóvel</Link>
        <Link href="/servicos" className="nav-link-mobile" onClick={closeMenu}>Serviços</Link>
        <Link href="/sobre" className="nav-link-mobile" onClick={closeMenu}>Sobre</Link>

        {user ? (
          <>
            {user.role === 'ADMIN' && (
              <>
                <Link href="/admin" className="nav-link-mobile" onClick={closeMenu}>Painel Admin</Link>
                <Link href="/perfil" className="nav-link-mobile" onClick={closeMenu}>Configurar 2FA</Link>
              </>
            )}
            <button onClick={handleLogout} className="login-btn-mobile" style={{ width: '100%', marginTop: '10px' }}>
              Sair
            </button>
          </>
        ) : (
          <Link href="/login" className="login-btn-mobile" onClick={closeMenu}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}
