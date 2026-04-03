import React from 'react'

export default function StatsCard({ label, value, icon: Icon, color = 'var(--accent)', sub }) {
    return (
        <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '22px 24px',
            display: 'flex', flexDirection: 'column', gap: 14,
            position: 'relative', overflow: 'hidden',
            transition: 'transform 0.2s, box-shadow 0.2s',
        }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
            }}
        >
            {/* Background accent blob */}
            <div style={{
                position: 'absolute', top: -20, right: -20, width: 80, height: 80,
                borderRadius: '50%', background: color, opacity: 0.1,
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {label}
                </span>
                <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Icon size={18} color={color} />
                </div>
            </div>

            <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.9rem', letterSpacing: '-0.02em', color }}>
                    {value}
                </div>
                {sub && <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
            </div>
        </div>
    )
}