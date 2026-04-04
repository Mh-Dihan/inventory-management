import React, { useEffect, useState } from 'react'
import { Package, Tag, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import StatsCard from './StatsCard'
import { api } from '../../services/api'

const statusStyle = {
    in_stock: { color: 'var(--success)', label: 'In Stock' },
    low_stock: { color: 'var(--warning)', label: 'Low Stock' },
    out_of_stock: { color: 'var(--danger)', label: 'Out of Stock' },
}

const COLORS = ['#f0c040', '#4fd1c5', '#9f7aea', '#f56565', '#68d391']

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
            <div style={{ color: 'var(--accent)' }}>{payload[0].value} products</div>
            {payload[1] && <div style={{ color: 'var(--accent2)' }}>${payload[1].value?.toFixed(0)} value</div>}
        </div>
    )
}

export default function Dashboard() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = () => {
            setLoading(true)
            api.getStats().then(data => { setStats(data); setLoading(false) }).catch(() => setLoading(false))
        }
        load()
        window.addEventListener('inventory-updated', load)
        return () => window.removeEventListener('inventory-updated', load)
    }, [])

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--muted)', gap: 10 }}>
            <div style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading dashboard…
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )

    if (!stats) return <div style={{ color: 'var(--danger)', padding: 20 }}>Failed to load dashboard data.</div>

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <StatsCard label="Total Products" value={stats.total_products} icon={Package} color="var(--accent)" sub="Across all categories" />
                <StatsCard label="Categories" value={stats.total_categories} icon={Tag} color="var(--accent2)" sub="Active categories" />
                <StatsCard label="Low Stock" value={stats.low_stock_count} icon={AlertTriangle} color="var(--warning)" sub="Need restocking" />
                <StatsCard label="Out of Stock" value={stats.out_of_stock_count} icon={AlertTriangle} color="var(--danger)" sub="Immediate attention" />
                <StatsCard label="Inventory Value" value={`$${stats.total_inventory_value?.toLocaleString()}`} icon={DollarSign} color="#9f7aea" sub="Total stock value" />
            </div>

            {/* Chart + Recent */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="dash-grid">

                {/* Bar Chart */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                        <TrendingUp size={16} color="var(--accent)" />
                        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>Stock by Category</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={stats.category_breakdown} barSize={28} barCategoryGap="30%">
                            <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                {stats.category_breakdown.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Recent Products */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 20 }}>Recently Added</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {stats.recent_products?.map(p => {
                            const s = statusStyle[p.status] || statusStyle.in_stock
                            return (
                                <div key={p.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 14px', background: 'var(--surface2)', borderRadius: 8,
                                    border: '1px solid var(--border)',
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{p.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>{p.sku} · {p.category_name}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>×{p.quantity}</div>
                                        <div style={{ fontSize: '0.72rem', color: s.color, fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <style>{`
        @media (max-width: 768px) {
          .dash-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
        </div>
    )
}
