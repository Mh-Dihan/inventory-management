import React, { useState, useEffect } from 'react'
import { ScanLine } from 'lucide-react'
import Modal from '../shared/Modal'
import Button from '../shared/Button'
import BarcodeScannerModal from './BarcodeScannerModal'

const TAG_COLORS = ['#f0c040', '#4fd1c5', '#68d391', '#ed8936', '#f56565', '#9f7aea']

const field = (label, children) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
        {children}
    </div>
)

const inputStyle = {
    background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '9px 12px', color: 'var(--text)', fontSize: '0.9rem',
    fontFamily: 'var(--font-body)', width: '100%', outline: 'none',
}

function normalizeTags(text, colorMap) {
    return text
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((name, index) => ({
            name,
            color: colorMap[name.toLowerCase()] || TAG_COLORS[index % TAG_COLORS.length],
        }))
}

const emptyForm = {
    name: '',
    sku: '',
    barcode: '',
    description: '',
    quantity: 0,
    price: 0,
    low_stock_threshold: 10,
    category_id: '',
    tags: [],
}

export default function ProductModal({ open, onClose, onSave, product, categories, initialBarcode = '' }) {
    const [form, setForm] = useState(emptyForm)
    const [tagsText, setTagsText] = useState('')
    const [tagColors, setTagColors] = useState({})
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [scannerOpen, setScannerOpen] = useState(false)

    useEffect(() => {
        if (product) {
            const colors = Object.fromEntries((product.tags || []).map((tag) => [tag.name.toLowerCase(), tag.color]))
            setForm({
                ...emptyForm,
                name: product.name || '',
                sku: product.sku || '',
                barcode: product.barcode || '',
                description: product.description || '',
                quantity: product.quantity ?? 0,
                price: product.price ?? 0,
                low_stock_threshold: product.low_stock_threshold ?? 10,
                category_id: product.category_id || categories[0]?.id || '',
                tags: product.tags || [],
            })
            setTagsText((product.tags || []).map((tag) => tag.name).join(', '))
            setTagColors(colors)
        } else {
            setForm({ ...emptyForm, barcode: initialBarcode, category_id: categories[0]?.id || '' })
            setTagsText('')
            setTagColors({})
        }
        setError('')
    }, [product, open, categories, initialBarcode])

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

    const tags = normalizeTags(tagsText, tagColors)

    const handleColorChange = (name, color) => {
        setTagColors((current) => ({ ...current, [name.toLowerCase()]: color }))
    }

    const handleSubmit = async () => {
        if (!form.name || !form.sku || !form.category_id) {
            setError('Name, SKU and Category are required.')
            return
        }
        setSaving(true)
        try {
            await onSave({ ...form, tags })
            onClose()
        } catch (e) {
            setError(e.message || 'Failed to save product.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal open={open} onClose={onClose} title={product?.id ? 'Edit Product' : 'Add New Product'}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && <div style={{ background: '#f5656522', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="product-modal-grid">
                    {field('Product Name',
                        <input style={inputStyle} value={form.name} onChange={set('name')} placeholder="e.g. Wireless Keyboard" />
                    )}
                    {field('SKU',
                        <input style={inputStyle} value={form.sku} onChange={set('sku')} placeholder="e.g. ELEC-001" />
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14 }} className="product-modal-grid barcode-field-grid">
                    {field('Barcode',
                        <input style={inputStyle} value={form.barcode} onChange={set('barcode')} placeholder="Scan or enter barcode" />
                    )}
                    <div style={{ alignSelf: 'end' }}>
                        <Button variant="secondary" onClick={() => setScannerOpen(true)} style={{ width: '100%', justifyContent: 'center' }}>
                            <ScanLine size={15} /> Scan Barcode
                        </Button>
                    </div>
                </div>

                {field('Description',
                    <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }} value={form.description} onChange={set('description')} placeholder="Optional description..." />
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }} className="product-modal-grid product-modal-grid-3">
                    {field('Quantity',
                        <input style={inputStyle} type="number" min="0" value={form.quantity} onChange={set('quantity')} />
                    )}
                    {field('Price ($)',
                        <input style={inputStyle} type="number" min="0" step="0.01" value={form.price} onChange={set('price')} />
                    )}
                    {field('Low Stock Alert',
                        <input style={inputStyle} type="number" min="1" value={form.low_stock_threshold} onChange={set('low_stock_threshold')} />
                    )}
                </div>

                {field('Category',
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.category_id} onChange={set('category_id')}>
                        <option value="">Select category...</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                )}

                {field('Tags',
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <input
                            style={inputStyle}
                            value={tagsText}
                            onChange={(e) => setTagsText(e.target.value)}
                            placeholder="Featured, Seasonal, Warehouse A"
                        />
                        {tags.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {tags.map((tag, index) => (
                                    <label key={`${tag.name}-${index}`} style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '6px 10px',
                                        borderRadius: 999,
                                        background: `${tag.color}22`,
                                        border: `1px solid ${tag.color}55`,
                                    }}>
                                        <span>{tag.name}</span>
                                        <input
                                            type="color"
                                            value={tag.color}
                                            onChange={(e) => handleColorChange(tag.name, e.target.value)}
                                            style={{ width: 18, height: 18, border: 'none', background: 'transparent' }}
                                        />
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={saving}>
                        {saving ? 'Saving...' : product?.id ? 'Update Product' : 'Add Product'}
                    </Button>
                </div>
            </div>

            <BarcodeScannerModal
                open={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onDetected={(barcode) => setForm((current) => ({ ...current, barcode }))}
            />

            <style>{`
                @media (max-width: 768px) {
                    .barcode-field-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </Modal>
    )
}
