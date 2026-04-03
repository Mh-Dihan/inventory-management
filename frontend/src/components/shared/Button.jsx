import React from 'react'

const variants = {
    primary: { background: 'var(--accent)', color: '#0d0f14', border: 'none' },
    secondary: { background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' },
    danger: { background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' },
    ghost: { background: 'transparent', color: 'var(--muted)', border: 'none' },
}

export default function Button({ children, variant = 'primary', size = 'md', onClick, disabled, style = {}, ...props }) {
    const padding = size === 'sm' ? '6px 12px' : size === 'lg' ? '12px 24px' : '9px 18px'
    const fontSize = size === 'sm' ? '0.8rem' : size === 'lg' ? '1rem' : '0.875rem'

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                ...variants[variant],
                padding, fontSize,
                borderRadius: 8, fontFamily: 'var(--font-body)', fontWeight: 500,
                cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                transition: 'opacity 0.15s, transform 0.1s',
                opacity: disabled ? 0.5 : 1,
                ...style,
            }}
            onMouseEnter={e => !disabled && (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => !disabled && (e.currentTarget.style.opacity = '1')}
            {...props}
        >
            {children}
        </button>
    )
}
