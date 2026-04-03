import React, { useCallback, useEffect, useState } from 'react'
import { Menu, Bell } from 'lucide-react'
import Modal from '../shared/Modal'
import { api } from '../../services/api'

export default function Navbar({ onMenuClick, title }) {
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [hasUnreadAlerts, setHasUnreadAlerts] = useState(false)

    const loadNotifications = useCallback(async () => {
        try {
            const [lowStock, outOfStock] = await Promise.all([
                api.getProducts({ status: 'low_stock' }),
                api.getProducts({ status: 'out_of_stock' }),
            ])

            const items = [
                ...outOfStock.map((product) => ({
                    id: `out-${product.id}`,
                    tone: 'var(--danger)',
                    label: `${product.name} is out of stock.`,
                    meta: `${product.sku} • ${product.category_name}`,
                })),
                ...lowStock.map((product) => ({
                    id: `low-${product.id}`,
                    tone: 'var(--warning)',
                    label: `${product.name} is low on stock.`,
                    meta: `${product.quantity} left • ${product.category_name}`,
                })),
            ]

            setNotifications(items)
            if (items.length) {
                setHasUnreadAlerts(true)
            }
        } catch {
            setNotifications([])
        }
    }, [])

    useEffect(() => {
        loadNotifications()

        const handleInventoryUpdate = () => loadNotifications()
        window.addEventListener('inventory-updated', handleInventoryUpdate)

        return () => window.removeEventListener('inventory-updated', handleInventoryUpdate)
    }, [loadNotifications])

    return (
        <>
            <header style={{
                height: 64, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
                position: 'sticky', top: 0, zIndex: 30,
            }}>
                <button
                    onClick={onMenuClick}
                    style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: 4, display: 'none' }}
                    className="menu-btn"
                >
                    <Menu size={22} />
                </button>

                <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
                    {title}
                </h1>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={() => {
                            loadNotifications()
                            setHasUnreadAlerts(false)
                            setNotificationsOpen(true)
                        }}
                        style={{
                            background: 'var(--surface2)', border: '1px solid var(--border)',
                            color: hasUnreadAlerts ? 'var(--danger)' : 'var(--text)',
                            borderRadius: 8,
                            padding: '7px 10px',
                            cursor: 'pointer',
                            position: 'relative',
                        }}
                    >
                        <Bell size={16} />
                        {hasUnreadAlerts && (
                            <span style={{
                                position: 'absolute',
                                top: 5,
                                right: 6,
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: 'var(--danger)',
                                boxShadow: '0 0 0 2px var(--surface2)',
                            }} />
                        )}
                    </button>
                    <div style={{
                        width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: '#0d0f14',
                    }}>
                        A
                    </div>
                </div>

                <style>{`
        @media (max-width: 768px) { .menu-btn { display: flex !important; } }
      `}</style>
            </header>

            <Modal open={notificationsOpen} onClose={() => setNotificationsOpen(false)} title="Notifications" width={420}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {!notifications.length && (
                        <div style={{
                            padding: '12px 14px',
                            borderRadius: 10,
                            border: '1px solid var(--border)',
                            background: 'var(--surface2)',
                            color: 'var(--muted)',
                            fontSize: '0.88rem',
                        }}>
                            No notifications right now.
                        </div>
                    )}
                    {notifications.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                padding: '12px 14px',
                                borderRadius: 10,
                                border: '1px solid var(--border)',
                                background: 'var(--surface2)',
                                color: 'var(--text)',
                                fontSize: '0.88rem',
                            }}
                        >
                            <div style={{ color: item.tone, fontWeight: 600 }}>{item.label}</div>
                            <div style={{ marginTop: 4, color: 'var(--muted)', fontSize: '0.78rem' }}>{item.meta}</div>
                        </div>
                    ))}
                </div>
            </Modal>
        </>
    )
}
