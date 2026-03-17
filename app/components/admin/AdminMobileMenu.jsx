'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function AdminMobileMenu({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      <button 
        className={`admin-menu-toggle ${isOpen ? 'open' : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle Menu"
      >
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
      </button>

      <div className={`admin-mobile-overlay ${isOpen ? 'show' : ''}`} onClick={() => setIsOpen(false)}></div>

      <div className={`admin-mobile-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="admin-mobile-sidebar-header">
           <span>Menu Administrativo</span>
           <button className="close-menu-btn" onClick={() => setIsOpen(false)}>&times;</button>
        </div>
        <div className="admin-mobile-sidebar-content" onClick={() => setIsOpen(false)}>
          {children}
        </div>
      </div>

      <style jsx>{`
        .admin-menu-toggle {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 30px;
          height: 21px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          padding: 6px;
          box-sizing: content-box;
          z-index: 1400;
          opacity: 1 !important;
          backdrop-filter: blur(4px);
        }

        .hamburger-line {
          width: 100%;
          height: 3px;
          background-color: #0f172a;
          border-radius: 3px;
          transition: all 0.3s ease;
          opacity: 1 !important;
        }

        .admin-menu-toggle.open {
          opacity: 0 !important;
          pointer-events: none;
        }

        .admin-menu-toggle.open .hamburger-line:nth-child(1) {
          transform: translateY(9px) rotate(45deg);
        }

        .admin-menu-toggle.open .hamburger-line:nth-child(2) {
          opacity: 0;
        }

        .admin-menu-toggle.open .hamburger-line:nth-child(3) {
          transform: translateY(-9px) rotate(-45deg);
        }

        .admin-mobile-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }

        .admin-mobile-overlay.show {
          opacity: 1;
          visibility: visible;
        }

        .admin-mobile-sidebar {
          position: fixed;
          top: 0;
          left: -280px;
          width: 280px;
          height: 100%;
          background: linear-gradient(180deg, var(--admin-gradient-start) 0%, var(--admin-gradient-end) 100%);
          z-index: 1001;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          box-shadow: 5px 0 15px rgba(0, 0, 0, 0.2);
        }

        .admin-mobile-sidebar.open {
          left: 0;
        }

        .admin-mobile-sidebar-header {
          padding: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .close-menu-btn {
          background: transparent;
          border: none;
          color: white;
          font-size: 2rem;
          line-height: 1;
          cursor: pointer;
          padding: 0;
        }

        .admin-mobile-sidebar-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px 0;
        }

      `}</style>
    </>
  );
}
