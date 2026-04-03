import React from 'react'
import { Pencil, Trash2, Plus, Minus } from 'lucide-react'

const statusConfig = {
    in_stock: { color: 'var(--success)', bg: '#68d39118', label: 'In Stock' },
    low_stock: { color: 'var(--warning)', bg: '#ed893618', label: 'Low Stock' },
    out_of_stock: { color: 'var(--danger)', bg: '#f5656518', label: 'Out of Stock' },
}

export default function ProductTable({
    products,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
    onEdit,
    onDelete,
    onAdjust,
}) {
    const handleDelete = (id) => {
        if (window.confirm('Are you sure?')) {
            onDelete(id)
        }
    }

    if (!products.length) return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 12, fontWeight: 700 }}>Inventory</div>
            <div style={{ fontWeight: 500 }}>No products found</div>
            <div style={{ fontSize: '0.85rem', marginTop: 6 }}>Try adjusting your search or add a new product.</div>
        </div>
    )

    const allSelected = products.length > 0 && products.every((product) => selectedIds.includes(product.id))

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: 980 }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '10px 14px', width: 42 }}>
                            <input type="checkbox" checked={allSelected} onChange={(e) => onToggleSelectAll(e.target.checked)} />
                        </th>
                        {['Product', 'SKU / Barcode', 'Category', 'Tags', 'Qty', 'Price', 'Added', 'Status', 'Actions'].map((h) => (
                            <th key={h} style={{
                                padding: '10px 14px', textAlign: 'left',
                                fontSize: '0.72rem', fontWeight: 600, color: 'var(--muted)',
                                textTransform: 'uppercase', letterSpacing: '0.07em',
                                whiteSpace: 'nowrap',
                            }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {products.map((p, i) => {
                        const s = statusConfig[p.status] || statusConfig.in_stock
                        return (
                            <tr
                                key={p.id}
                                style={{
                                    borderBottom: '1px solid var(--border)',
                                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
                            >
                                <td style={{ padding: '12px 14px' }}>
                                    <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => onToggleSelect(p.id)} />
                                </td>
                                <td style={{ padding: '12px 14px', fontWeight: 500 }}>
                                    <div>{p.name}</div>
                                    {p.description && <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }} className="truncate">{p.description}</div>}
                                </td>
                                <td style={{ padding: '12px 14px', color: 'var(--muted)', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                    <div>{p.sku}</div>
                                    <div style={{ fontSize: '0.72rem', marginTop: 4 }}>{p.barcode || 'No barcode'}</div>
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                    <span style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 8px', fontSize: '0.78rem' }}>
                                        {p.category_name}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 200 }}>
                                        {(p.tags || []).length ? p.tags.map((tag) => (
                                            <span
                                                key={`${p.id}-${tag.name}`}
                                                style={{
                                                    background: `${tag.color}22`,
                                                    color: tag.color,
                                                    border: `1px solid ${tag.color}55`,
                                                    borderRadius: 999,
                                                    padding: '3px 8px',
                                                    fontSize: '0.72rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {tag.name}
                                            </span>
                                        )) : <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>No tags</span>}
                                    </div>
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <button onClick={() => onAdjust(p.id, -1)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 5px', cursor: 'pointer', color: 'var(--text)', display: 'flex' }}>
                                            <Minus size={12} />
                                        </button>
                                        <span style={{ fontWeight: 600, minWidth: 28, textAlign: 'center' }}>{p.quantity}</span>
                                        <button onClick={() => onAdjust(p.id, 1)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 5px', cursor: 'pointer', color: 'var(--text)', display: 'flex' }}>
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                </td>
                                <td style={{ padding: '12px 14px', fontWeight: 600 }}>${p.price?.toFixed(2)}</td>
                                <td style={{ padding: '12px 14px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                                    {new Date(p.created_at).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600 }}>
                                        {s.label}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => onEdit(p)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: 'var(--accent)', display: 'flex' }}>
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            style={{
                                                background: 'var(--surface2)',
                                                border: '1px solid var(--border)',
                                                borderRadius: 6,
                                                padding: '6px 8px',
                                                cursor: 'pointer',
                                                color: 'var(--danger)',
                                                display: 'flex',
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
