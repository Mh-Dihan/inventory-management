import React, { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Filter, Bookmark, Tags, ScanLine } from 'lucide-react'
import Button from '../shared/Button'
import ProductTable from './ProductTable'
import ProductModal from './ProductModal'
import BarcodeScannerModal from './BarcodeScannerModal'
import { api } from '../../services/api'

const PRESET_STORAGE_KEY = 'inventory-hub-product-presets'
const TAG_COLORS = ['#f0c040', '#4fd1c5', '#68d391', '#ed8936', '#f56565', '#9f7aea']

const notifyInventoryUpdated = () => window.dispatchEvent(new Event('inventory-updated'))

const inputStyle = {
    background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '9px 12px 9px 36px', color: 'var(--text)', fontSize: '0.875rem',
    fontFamily: 'var(--font-body)', outline: 'none', width: '100%',
}

const fieldInputStyle = {
    background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '9px 12px', color: 'var(--text)', fontSize: '0.875rem',
    fontFamily: 'var(--font-body)', outline: 'none',
}

const initialFilters = {
    search: '',
    status: '',
    category_id: '',
    min_price: '',
    max_price: '',
    tags: '',
    sort_by: 'updated_at',
    sort_dir: 'desc',
}

function uniqueTags(products) {
    const seen = new Map()
    products.forEach((product) => {
        ;(product.tags || []).forEach((tag) => {
            if (!seen.has(tag.name.toLowerCase())) {
                seen.set(tag.name.toLowerCase(), tag)
            }
        })
    })
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))
}

function normalizeBulkTags(text, colorMap) {
    return text
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((name, index) => ({
            name,
            color: colorMap[name.toLowerCase()] || TAG_COLORS[index % TAG_COLORS.length],
        }))
}

export default function Products() {
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState(initialFilters)
    const [modalOpen, setModalOpen] = useState(false)
    const [editProduct, setEditProduct] = useState(null)
    const [selectedIds, setSelectedIds] = useState([])
    const [bulkTagsText, setBulkTagsText] = useState('')
    const [bulkTagColors, setBulkTagColors] = useState({})
    const [bulkMode, setBulkMode] = useState('append')
    const [presets, setPresets] = useState([])
    const [error, setError] = useState('')
    const [scannerOpen, setScannerOpen] = useState(false)
    const [draftBarcode, setDraftBarcode] = useState('')

    const load = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const params = {}
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== '' && value != null) params[key] = value
            })
            const [prods, cats] = await Promise.all([api.getProducts(params), api.getCategories()])
            setProducts(prods)
            setCategories(cats)
            setSelectedIds((current) => current.filter((id) => prods.some((product) => product.id === id)))
        } catch (e) {
            setError(e.message || 'Failed to load products.')
        } finally {
            setLoading(false)
        }
    }, [filters])

    useEffect(() => {
        const savedPresets = JSON.parse(window.localStorage.getItem(PRESET_STORAGE_KEY) || '[]')
        setPresets(savedPresets)
    }, [])

    useEffect(() => { load() }, [load])

    const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))

    const handleSave = async (data) => {
        if (editProduct?.id) await api.updateProduct(editProduct.id, data)
        else await api.createProduct(data)
        setDraftBarcode('')
        notifyInventoryUpdated()
        await load()
    }

    const handleDelete = async (id) => {
        await api.deleteProduct(id)
        notifyInventoryUpdated()
        await load()
    }

    const handleAdjust = async (id, delta) => {
        await api.adjustStock(id, delta)
        notifyInventoryUpdated()
        await load()
    }

    const toggleSelect = (id) => {
        setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])
    }

    const toggleSelectAll = (checked) => {
        setSelectedIds(checked ? products.map((product) => product.id) : [])
    }

    const bulkTags = normalizeBulkTags(bulkTagsText, bulkTagColors)

    const handleBulkAssign = async () => {
        if (!selectedIds.length || !bulkTags.length) return
        await api.bulkAssignTags({ product_ids: selectedIds, tags: bulkTags, mode: bulkMode })
        setBulkTagsText('')
        setSelectedIds([])
        notifyInventoryUpdated()
        await load()
    }

    const handleSavePreset = () => {
        const name = window.prompt('Preset name')
        if (!name) return
        const nextPresets = [...presets.filter((preset) => preset.name !== name), { name, filters }]
        setPresets(nextPresets)
        window.localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(nextPresets))
    }

    const handleApplyPreset = (name) => {
        const preset = presets.find((item) => item.name === name)
        if (preset) setFilters({ ...initialFilters, ...preset.filters })
    }

    const handleDeletePreset = (name) => {
        const nextPresets = presets.filter((preset) => preset.name !== name)
        setPresets(nextPresets)
        window.localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(nextPresets))
    }

    const handleBarcodeDetected = async (barcode) => {
        updateFilter('search', barcode)
        setScannerOpen(false)

        try {
            const product = await api.lookupProductByBarcode(barcode)
            setDraftBarcode('')
            setEditProduct(product)
            setModalOpen(true)
        } catch {
            setEditProduct(null)
            setDraftBarcode(barcode)
            setModalOpen(true)
        }
    }

    const allTags = uniqueTags(products)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(260px, 1.6fr) repeat(6, minmax(120px, 1fr)) auto auto',
                gap: 12,
                alignItems: 'center',
            }} className="products-filter-grid">
                <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
                    <input
                        style={inputStyle}
                        placeholder="Search name, SKU, barcode, category, description, tags"
                        value={filters.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                    />
                </div>

                <select style={fieldInputStyle} value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
                    <option value="">All Status</option>
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                </select>

                <select style={fieldInputStyle} value={filters.category_id} onChange={(e) => updateFilter('category_id', e.target.value)}>
                    <option value="">All Categories</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <input style={fieldInputStyle} type="number" min="0" step="0.01" placeholder="Min $" value={filters.min_price} onChange={(e) => updateFilter('min_price', e.target.value)} />
                <input style={fieldInputStyle} type="number" min="0" step="0.01" placeholder="Max $" value={filters.max_price} onChange={(e) => updateFilter('max_price', e.target.value)} />

                <select style={fieldInputStyle} value={filters.sort_by} onChange={(e) => updateFilter('sort_by', e.target.value)}>
                    <option value="updated_at">Recently Updated</option>
                    <option value="date">Date Added</option>
                    <option value="name">Name</option>
                    <option value="price">Price</option>
                    <option value="quantity">Qty</option>
                </select>

                <select style={fieldInputStyle} value={filters.sort_dir} onChange={(e) => updateFilter('sort_dir', e.target.value)}>
                    <option value="desc">Desc</option>
                    <option value="asc">Asc</option>
                </select>

                <Button variant="secondary" onClick={() => setScannerOpen(true)}>
                    <ScanLine size={15} /> Scan
                </Button>

                <Button onClick={() => { setEditProduct(null); setModalOpen(true) }}>
                    <Plus size={15} /> Add Product
                </Button>
            </div>

            {error && (
                <div style={{ background: '#f5656522', border: '1px solid var(--danger)', borderRadius: 10, padding: '12px 14px', color: 'var(--danger)', fontSize: '0.85rem' }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr auto auto', gap: 12, alignItems: 'center' }} className="products-subbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minHeight: 40 }}>
                    <Filter size={14} color="var(--muted)" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Tag filter</span>
                    {allTags.length ? allTags.map((tag) => {
                        const active = filters.tags.split(',').map((value) => value.trim().toLowerCase()).includes(tag.name.toLowerCase())
                        return (
                            <button
                                key={tag.name}
                                onClick={() => {
                                    const current = filters.tags.split(',').map((value) => value.trim()).filter(Boolean)
                                    const exists = current.some((value) => value.toLowerCase() === tag.name.toLowerCase())
                                    const next = exists ? current.filter((value) => value.toLowerCase() !== tag.name.toLowerCase()) : [...current, tag.name]
                                    updateFilter('tags', next.join(','))
                                }}
                                style={{
                                    background: active ? `${tag.color}22` : 'var(--surface2)',
                                    color: active ? tag.color : 'var(--muted)',
                                    border: `1px solid ${active ? `${tag.color}66` : 'var(--border)'}`,
                                    borderRadius: 999,
                                    padding: '6px 10px',
                                    cursor: 'pointer',
                                    fontSize: '0.76rem',
                                    fontWeight: 600,
                                }}
                            >
                                {tag.name}
                            </button>
                        )
                    }) : <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>No tags yet</span>}
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Bookmark size={14} color="var(--muted)" />
                    <select defaultValue="" style={{ ...fieldInputStyle, width: '100%' }} onChange={(e) => e.target.value && handleApplyPreset(e.target.value)}>
                        <option value="">Saved presets</option>
                        {presets.map((preset) => <option key={preset.name} value={preset.name}>{preset.name}</option>)}
                    </select>
                </div>

                <Button variant="secondary" onClick={handleSavePreset}>Save Preset</Button>
                <Button variant="ghost" onClick={() => {
                    const selectedPreset = window.prompt('Delete preset by name')
                    if (selectedPreset) handleDeletePreset(selectedPreset)
                }}>
                    Remove Preset
                </Button>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                    { label: `${products.length} total`, color: 'var(--muted)' },
                    { label: `${products.filter((p) => p.status === 'low_stock').length} low stock`, color: 'var(--warning)' },
                    { label: `${products.filter((p) => p.status === 'out_of_stock').length} out of stock`, color: 'var(--danger)' },
                    { label: `${selectedIds.length} selected`, color: 'var(--accent2)' },
                ].map((b) => (
                    <span key={b.label} style={{ fontSize: '0.78rem', color: b.color, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 10px' }}>
                        {b.label}
                    </span>
                ))}
            </div>

            <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: 16,
                display: 'grid',
                gridTemplateColumns: '1.4fr 180px 140px auto',
                gap: 12,
                alignItems: 'center',
            }} className="bulk-tag-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: '0.8rem' }}>
                        <Tags size={15} />
                        Bulk tag assignment
                    </div>
                    <input
                        style={fieldInputStyle}
                        value={bulkTagsText}
                        onChange={(e) => setBulkTagsText(e.target.value)}
                        placeholder="Tag selected products, e.g. Clearance, Priority"
                    />
                    {bulkTags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {bulkTags.map((tag) => (
                                <label key={tag.name} style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '5px 10px', background: `${tag.color}22`, border: `1px solid ${tag.color}55`, borderRadius: 999 }}>
                                    <span style={{ color: tag.color, fontSize: '0.78rem', fontWeight: 700 }}>{tag.name}</span>
                                    <input
                                        type="color"
                                        value={tag.color}
                                        onChange={(e) => setBulkTagColors((current) => ({ ...current, [tag.name.toLowerCase()]: e.target.value }))}
                                        style={{ width: 16, height: 16, border: 'none', background: 'transparent' }}
                                    />
                                </label>
                            ))}
                        </div>
                    )}
                </div>
                <select style={fieldInputStyle} value={bulkMode} onChange={(e) => setBulkMode(e.target.value)}>
                    <option value="append">Append tags</option>
                    <option value="replace">Replace tags</option>
                </select>
                <Button variant="secondary" onClick={() => setSelectedIds([])}>Clear Selection</Button>
                <Button onClick={handleBulkAssign} disabled={!selectedIds.length || !bulkTags.length}>Apply Tags</Button>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: 'var(--muted)', gap: 10 }}>
                        <div style={{ width: 18, height: 18, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Loading...
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : (
                    <ProductTable
                        products={products}
                        selectedIds={selectedIds}
                        onToggleSelect={toggleSelect}
                        onToggleSelectAll={toggleSelectAll}
                        onEdit={(p) => { setEditProduct(p); setModalOpen(true) }}
                        onDelete={handleDelete}
                        onAdjust={handleAdjust}
                    />
                )}
            </div>

            <ProductModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setDraftBarcode('') }}
                onSave={handleSave}
                product={editProduct}
                categories={categories}
                initialBarcode={draftBarcode}
            />

            <BarcodeScannerModal
                open={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onDetected={handleBarcodeDetected}
            />

            <style>{`
                @media (max-width: 1200px) {
                    .products-filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                    .products-subbar { grid-template-columns: 1fr !important; }
                    .bulk-tag-grid { grid-template-columns: 1fr !important; }
                }

                @media (max-width: 768px) {
                    .products-filter-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    )
}
