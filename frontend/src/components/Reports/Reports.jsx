import React, { useEffect, useState } from 'react'
import { FileSpreadsheet, FileText, Printer, AlertTriangle } from 'lucide-react'
import Button from '../shared/Button'
import { api } from '../../services/api'

function downloadBlob(content, type, filename) {
    const blob = new Blob([content], { type })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
}

function escapeCsv(value) {
    const safe = String(value ?? '')
    if (safe.includes(',') || safe.includes('"') || safe.includes('\n')) {
        return `"${safe.replace(/"/g, '""')}"`
    }
    return safe
}

function buildTableRows(products) {
    return products.map((product) => `
        <tr>
            <td>${escapeHtml(product.name)}</td>
            <td>${escapeHtml(product.sku)}</td>
            <td>${escapeHtml(product.barcode || '')}</td>
            <td>${escapeHtml(product.category_name)}</td>
            <td>${escapeHtml(product.quantity)}</td>
            <td>${escapeHtml(product.price.toFixed(2))}</td>
            <td>${escapeHtml(product.status.replaceAll('_', ' '))}</td>
            <td>${escapeHtml((product.tags || []).map((tag) => tag.name).join(', '))}</td>
        </tr>
    `).join('')
}

export default function Reports() {
    const [products, setProducts] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const [allProducts, dashboardStats] = await Promise.all([
                    api.getProducts({ sort_by: 'name', sort_dir: 'asc' }),
                    api.getStats(),
                ])
                setProducts(allProducts)
                setStats(dashboardStats)
            } finally {
                setLoading(false)
            }
        }

        load()
        window.addEventListener('inventory-updated', load)
        return () => window.removeEventListener('inventory-updated', load)
    }, [])

    const lowStockProducts = products.filter((product) => product.status !== 'in_stock')

    const exportCsv = () => {
        const header = ['Name', 'SKU', 'Barcode', 'Category', 'Quantity', 'Price', 'Status', 'Tags', 'Created At']
        const rows = products.map((product) => [
            product.name,
            product.sku,
            product.barcode || '',
            product.category_name,
            product.quantity,
            product.price,
            product.status,
            (product.tags || []).map((tag) => tag.name).join(' | '),
            new Date(product.created_at).toLocaleDateString(),
        ])
        const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
        downloadBlob(csv, 'text/csv;charset=utf-8;', 'inventory-products.csv')
    }

    const exportExcel = () => {
        const html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
                <head>
                    <meta charset="utf-8" />
                </head>
                <body>
                    <table border="1">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>SKU</th>
                                <th>Barcode</th>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th>Tags</th>
                            </tr>
                        </thead>
                        <tbody>${buildTableRows(products)}</tbody>
                    </table>
                </body>
            </html>
        `
        downloadBlob(html, 'application/vnd.ms-excel;charset=utf-8;', 'inventory-products.xls')
    }

    const printInventoryReport = () => {
        const reportWindow = window.open('', '_blank', 'width=960,height=720')
        if (!reportWindow) return

        reportWindow.document.write(`
            <html>
                <head>
                    <title>Inventory Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
                        h1 { margin-bottom: 6px; }
                        p { color: #4b5563; margin-top: 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; font-size: 12px; }
                        th { background: #f3f4f6; }
                    </style>
                </head>
                <body>
                    <h1>Inventory Report</h1>
                    <p>Generated ${escapeHtml(new Date().toLocaleString())}</p>
                    <table>
                        <thead>
                            <tr><th>Name</th><th>SKU</th><th>Category</th><th>Qty</th><th>Price</th><th>Status</th><th>Tags</th></tr>
                        </thead>
                        <tbody>${buildTableRows(products)}</tbody>
                    </table>
                </body>
            </html>
        `)
        reportWindow.document.close()
        reportWindow.focus()
        reportWindow.print()
    }

    const exportCategorySummaryPdf = () => {
        const reportWindow = window.open('', '_blank', 'width=960,height=720')
        if (!reportWindow || !stats) return

        const rows = stats.category_breakdown.map((item) => `
            <tr>
                <td>${escapeHtml(item.name)}</td>
                <td>${escapeHtml(item.count)}</td>
                <td>$${escapeHtml(Number(item.value || 0).toFixed(2))}</td>
            </tr>
        `).join('')

        reportWindow.document.write(`
            <html>
                <head>
                    <title>Category Summary PDF</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
                        h1 { margin-bottom: 6px; }
                        p { color: #4b5563; margin-top: 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; font-size: 12px; }
                        th { background: #f3f4f6; }
                        .note { margin-top: 18px; color: #6b7280; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <h1>Category Summary</h1>
                    <p>Use Print and choose "Save as PDF". Generated ${escapeHtml(new Date().toLocaleString())}</p>
                    <table>
                        <thead>
                            <tr><th>Category</th><th>Products</th><th>Inventory Value</th></tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <p class="note">This view is print-optimized so it can be saved directly as PDF from the browser.</p>
                </body>
            </html>
        `)
        reportWindow.document.close()
        reportWindow.focus()
        reportWindow.print()
    }

    if (loading) {
        return <div style={{ color: 'var(--muted)' }}>Loading reports...</div>
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <FileSpreadsheet size={18} color="var(--accent2)" />
                        <h3>Products Export</h3>
                    </div>
                    <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 14 }}>Export all products to CSV or Excel-compatible format.</p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <Button onClick={exportCsv}>Export CSV</Button>
                        <Button variant="secondary" onClick={exportExcel}>Export Excel</Button>
                    </div>
                </div>

                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <Printer size={18} color="var(--accent)" />
                        <h3>Print Report</h3>
                    </div>
                    <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 14 }}>Generate a print-ready inventory report for operations or audits.</p>
                    <Button onClick={printInventoryReport}>Open Print View</Button>
                </div>

                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <FileText size={18} color="#9f7aea" />
                        <h3>Category PDF</h3>
                    </div>
                    <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 14 }}>Open a print-ready category summary that can be saved as PDF from the browser.</p>
                    <Button onClick={exportCategorySummaryPdf}>Open PDF View</Button>
                </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <AlertTriangle size={18} color="var(--warning)" />
                    <h3>Low Stock Alert Report</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 18 }}>
                    <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 14, border: '1px solid var(--border)' }}>
                        <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Low stock items</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{stats?.low_stock_count || 0}</div>
                    </div>
                    <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 14, border: '1px solid var(--border)' }}>
                        <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Out of stock</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{stats?.out_of_stock_count || 0}</div>
                    </div>
                    <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 14, border: '1px solid var(--border)' }}>
                        <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Inventory value</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>${Number(stats?.total_inventory_value || 0).toLocaleString()}</div>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                {['Product', 'Category', 'Qty', 'Threshold', 'Status', 'Tags'].map((item) => (
                                    <th key={item} style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>{item}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {lowStockProducts.map((product) => (
                                <tr key={product.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '10px 12px' }}>{product.name}</td>
                                    <td style={{ padding: '10px 12px' }}>{product.category_name}</td>
                                    <td style={{ padding: '10px 12px' }}>{product.quantity}</td>
                                    <td style={{ padding: '10px 12px' }}>{product.low_stock_threshold}</td>
                                    <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{product.status.replaceAll('_', ' ')}</td>
                                    <td style={{ padding: '10px 12px' }}>{(product.tags || []).map((tag) => tag.name).join(', ') || 'No tags'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
