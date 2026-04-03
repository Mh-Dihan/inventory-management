const BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

async function request(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    })
    if (!res.ok) {
        let message = `API error: ${res.status}`
        try {
            const data = await res.json()
            if (data?.message) message = data.message
        } catch {
            const text = await res.text().catch(() => '')
            if (text) message = text
        }
        throw new Error(message)
    }
    if (res.status === 204) return null
    return res.json()
}

export const api = {
    // Dashboard
    getStats: () => request('/dashboard/stats'),

    // Products
    getProducts: (params = {}) => {
        const qs = new URLSearchParams(params).toString()
        return request(`/products/${qs ? '?' + qs : ''}`)
    },
    getProduct: (id) => request(`/products/${id}`),
    lookupProductByBarcode: (barcode) => request(`/products/lookup?barcode=${encodeURIComponent(barcode)}`),
    createProduct: (data) => request('/products/', { method: 'POST', body: JSON.stringify(data) }),
    updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
    adjustStock: (id, adjustment) => request(`/products/${id}/adjust`, { method: 'PATCH', body: JSON.stringify({ adjustment }) }),
    bulkAssignTags: (data) => request('/products/bulk-tags', { method: 'POST', body: JSON.stringify(data) }),

    // Categories
    getCategories: () => request('/categories/'),
    createCategory: (data) => request('/categories/', { method: 'POST', body: JSON.stringify(data) }),
    updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
}
