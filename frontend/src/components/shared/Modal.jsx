import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, width = 520 }) {
    useEffect(() => {
        const handler = (e) => e.key === 'Escape' && onClose()
        if (open) document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [open, onClose])

    if (!open) return null

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 100,
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '16px', animation: 'fadeIn 0.2s ease',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 14, width: '100%', maxWidth: width,
                    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                    animation: 'fadeIn 0.25s ease',
                    maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 24px', borderBottom: '1px solid var(--border)',
                }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>{title}</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'var(--surface2)', border: '1px solid var(--border)',
                            color: 'var(--muted)', borderRadius: 6, padding: '5px 7px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                        }}
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                    {children}
                </div>
            </div>
        </div>
    )
}