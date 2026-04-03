import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import Button from '../shared/Button'
import Modal from '../shared/Modal'
import { api } from '../../services/api'

const notifyInventoryUpdated = () => window.dispatchEvent(new Event('inventory-updated'))

const inputStyle = {
    background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '9px 12px', color: 'var(--text)', fontSize: '0.9rem',
    fontFamily: 'var(--font-body)', width: '100%', outline: 'none',
}

const field = (label, children) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
        {children}
    </div>
)

export default function Categories() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editCat, setEditCat] = useState(null)
    const [form, setForm] = useState({ name: '', description: '' })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [pageError, setPageError] = useState('')
    const load = async () => {
        setLoading(true)
        try {
            const cats = await api.getCategories()
            setCategories(cats)
            setPageError('')
        } catch (e) {
            setPageError(e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const openModal = (cat = null) => {
        setEditCat(cat)
        setForm(cat ? { name: cat.name, description: cat.description || '' } : { name: '', description: '' })
        setError('')
        setPageError('')
        setModalOpen(true)
    }

    const handleSave = async () => {
        if (!form.name) { setError('Category name is required.'); return }
        setSaving(true)
        try {
            if (editCat) await api.updateCategory(editCat.id, form)
            else await api.createCategory(form)
            notifyInventoryUpdated()
            setModalOpen(false)
            load()
        } catch (e) {
            setError(e.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) {
            return
        }

        try {
            await api.deleteCategory(id)
            notifyInventoryUpdated()
            setPageError('')
            load()
        } catch (e) {
            setPageError(e.message)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {pageError && <div style={{ background: '#f5656522', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', color: 'var(--danger)', fontSize: '0.85rem' }}>{pageError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={() => openModal()}>
                    <Plus size={15} /> Add Category
                </Button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60, color: 'var(--muted)', gap: 10 }}>
                    <div style={{ width: 18, height: 18, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Loading…
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                    {categories.map(cat => (
                        <div key={cat.id} style={{
                            background: 'var(--surface)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)', padding: 22,
                            display: 'flex', flexDirection: 'column', gap: 14,
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)' }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--accent)22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Tag size={19} color="var(--accent)" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>{cat.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 3 }}>{cat.description || 'No description'}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '1.1rem' }}>{cat.product_count}</span> products
                                </span>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={() => openModal(cat)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: 'var(--accent)', display: 'flex' }}>
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(cat.id)} style={{
                                        background: 'var(--surface2)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: 'var(--danger)', display: 'flex',
                                    }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editCat ? 'Edit Category' : 'New Category'} width={420}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {error && <div style={{ background: '#f5656522', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</div>}
                    {field('Name', <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name…" />)}
                    {field('Description', <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description…" />)}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editCat ? 'Update' : 'Create'}</Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
