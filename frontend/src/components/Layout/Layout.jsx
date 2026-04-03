import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

const titles = {
    '/': 'Dashboard',
    '/products': 'Products',
    '/categories': 'Categories',
    '/reports': 'Reports & Export',
}

export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { pathname } = useLocation()
    const title = titles[pathname] || 'Inventory Hub'

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div style={{ flex: 1, marginLeft: 'var(--sidebar-w)', display: 'flex', flexDirection: 'column' }} className="main-wrap">
                <Navbar onMenuClick={() => setSidebarOpen(true)} title={title} />
                <main style={{ flex: 1, padding: '28px 28px', animation: 'fadeIn 0.3s ease' }}>
                    {children}
                </main>
            </div>

            <style>{`
        @media (max-width: 768px) {
          .main-wrap { margin-left: 0 !important; }
        }
      `}</style>
        </div>
    )
}
