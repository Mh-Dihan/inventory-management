import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, Tag, BarChart2, X, Boxes } from 'lucide-react'

const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/categories', label: 'Categories', icon: Tag },
    { to: '/reports', label: 'Reports', icon: BarChart2 },
]

export default function Sidebar({ open, onClose }) {
    return (
        <>
            {/* Overlay mobile */}
            {open && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
                    onClick={onClose}
                />
            )}

            <aside style={{
                position: 'fixed', top: 0, left: 0, height: '100vh',
                width: 'var(--sidebar-w)', background: 'var(--surface)',
                borderRight: '1px solid var(--border)', zIndex: 50,
                display: 'flex', flexDirection: 'column',
                transform: open ? 'translateX(0)' : undefined,
                transition: 'transform 0.25s ease',
            }}
                className="sidebar"
            >
                {/* Logo */}
                <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, background: 'var(--accent)', borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Boxes size={20} color="#0d0f14" strokeWidth={2.5} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.05, flex: 1 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.02rem', letterSpacing: '-0.02em' }}>
                            Inventory
                        </span>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.02rem', letterSpacing: '-0.02em' }}>
                            Hub
                        </span>
                    </div>
                    <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'none' }} className="sidebar-close">
                        <X size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <p style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--muted)', textTransform: 'uppercase', padding: '8px 12px 4px' }}>Main Menu</p>
                    {links.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            style={({ isActive }) => ({
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 14px', borderRadius: 8,
                                textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500,
                                color: isActive ? '#0d0f14' : 'var(--muted)',
                                background: isActive ? 'var(--accent)' : 'transparent',
                                transition: 'all 0.15s ease',
                            })}
                        >
                            <Icon size={17} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--muted)' }}>
                    v1.0.0 · Inventory System
                </div>
            </aside>

            <style>{`
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar-close { display: flex !important; }
          .sidebar[style*="translateX(0)"] { transform: translateX(0) !important; }
        }
      `}</style>
        </>
    )
}
