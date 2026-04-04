const STORAGE_KEY = 'inventory-hub-store-v1'

const TAG_FALLBACK = '#4fd1c5'

const seedCategories = [
    { id: 1, name: 'Electronics', description: 'Electronic devices & accessories', created_at: '2026-01-01T08:00:00.000Z' },
    { id: 2, name: 'Clothing', description: 'Apparel and fashion', created_at: '2026-01-01T08:05:00.000Z' },
    { id: 3, name: 'Food & Beverage', description: 'Consumable goods', created_at: '2026-01-01T08:10:00.000Z' },
    { id: 4, name: 'Office Supplies', description: 'Stationery and office needs', created_at: '2026-01-01T08:15:00.000Z' },
]

const seedProducts = [
    { id: 1, name: 'Laptop Pro 15"', sku: 'ELEC-001', barcode: '', description: '', quantity: 45, price: 1299.99, low_stock_threshold: 10, tags: [{ name: 'Featured', color: '#f0c040' }, { name: 'Premium', color: '#9f7aea' }], category_id: 1, created_at: '2026-01-02T09:00:00.000Z', updated_at: '2026-01-02T09:00:00.000Z' },
    { id: 2, name: 'Wireless Mouse', sku: 'ELEC-002', barcode: '', description: '', quantity: 8, price: 29.99, low_stock_threshold: 15, tags: [{ name: 'Low Margin', color: '#ed8936' }], category_id: 1, created_at: '2026-01-03T09:00:00.000Z', updated_at: '2026-01-03T09:00:00.000Z' },
    { id: 3, name: 'USB-C Hub', sku: 'ELEC-003', barcode: '', description: '', quantity: 120, price: 49.99, low_stock_threshold: 20, tags: [{ name: 'Bundle', color: '#4fd1c5' }], category_id: 1, created_at: '2026-01-04T09:00:00.000Z', updated_at: '2026-01-04T09:00:00.000Z' },
    { id: 4, name: 'Blue T-Shirt L', sku: 'CLO-001', barcode: '', description: '', quantity: 3, price: 19.99, low_stock_threshold: 10, tags: [{ name: 'Seasonal', color: '#f56565' }], category_id: 2, created_at: '2026-01-05T09:00:00.000Z', updated_at: '2026-01-05T09:00:00.000Z' },
    { id: 5, name: 'Denim Jeans 32', sku: 'CLO-002', barcode: '', description: '', quantity: 60, price: 59.99, low_stock_threshold: 10, tags: [], category_id: 2, created_at: '2026-01-06T09:00:00.000Z', updated_at: '2026-01-06T09:00:00.000Z' },
    { id: 6, name: 'Coffee Beans 1kg', sku: 'FB-001', barcode: '', description: '', quantity: 200, price: 14.99, low_stock_threshold: 30, tags: [{ name: 'Top Seller', color: '#68d391' }], category_id: 3, created_at: '2026-01-07T09:00:00.000Z', updated_at: '2026-01-07T09:00:00.000Z' },
    { id: 7, name: 'Green Tea Pack', sku: 'FB-002', barcode: '', description: '', quantity: 5, price: 8.99, low_stock_threshold: 20, tags: [], category_id: 3, created_at: '2026-01-08T09:00:00.000Z', updated_at: '2026-01-08T09:00:00.000Z' },
    { id: 8, name: 'Ballpoint Pens (10pk)', sku: 'OFF-001', barcode: '', description: '', quantity: 300, price: 4.99, low_stock_threshold: 50, tags: [], category_id: 4, created_at: '2026-01-09T09:00:00.000Z', updated_at: '2026-01-09T09:00:00.000Z' },
]

function clone(value) {
    return JSON.parse(JSON.stringify(value))
}

function error(message) {
    throw new Error(message)
}

function nowIso() {
    return new Date().toISOString()
}

function getStatus(product) {
    const quantity = Number(product.quantity || 0)
    const threshold = Number(product.low_stock_threshold || 0)
    if (quantity === 0) return 'out_of_stock'
    if (quantity <= threshold) return 'low_stock'
    return 'in_stock'
}

function normalizeBarcode(value) {
    const barcode = String(value || '').trim()
    return barcode || null
}

function normalizeTags(tags) {
    const normalized = []
    const seen = new Set()

    for (const tag of tags || []) {
        let name = ''
        let color = TAG_FALLBACK

        if (typeof tag === 'string') {
            name = tag.trim()
        } else if (tag && typeof tag === 'object') {
            name = String(tag.name || '').trim()
            color = String(tag.color || TAG_FALLBACK).trim() || TAG_FALLBACK
        }

        const key = name.toLowerCase()
        if (!name || seen.has(key)) continue
        seen.add(key)
        normalized.push({ name, color })
    }

    return normalized
}

function createSeedState() {
    return {
        categories: clone(seedCategories),
        products: clone(seedProducts).map((product) => ({ ...product, tags: normalizeTags(product.tags) })),
        counters: { category: seedCategories.length + 1, product: seedProducts.length + 1 },
    }
}

function loadState() {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
        const seeded = createSeedState()
        saveState(seeded)
        return seeded
    }

    try {
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.products) || !parsed.counters) {
            throw new Error('Invalid store')
        }
        return parsed
    } catch {
        const seeded = createSeedState()
        saveState(seeded)
        return seeded
    }
}

function saveState(state) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function buildCategoryMap(categories) {
    return new Map(categories.map((category) => [category.id, category]))
}

function serializeCategory(category, products) {
    return {
        id: category.id,
        name: category.name,
        description: category.description,
        product_count: products.filter((product) => product.category_id === category.id).length,
        created_at: category.created_at,
    }
}

function serializeProduct(product, categories) {
    const category = categories.get(product.category_id)
    return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        description: product.description,
        quantity: Number(product.quantity),
        price: Number(product.price),
        low_stock_threshold: Number(product.low_stock_threshold),
        tags: normalizeTags(product.tags),
        category_id: product.category_id,
        category_name: category?.name || null,
        status: getStatus(product),
        inventory_value: Number((Number(product.price || 0) * Number(product.quantity || 0)).toFixed(2)),
        created_at: product.created_at,
        updated_at: product.updated_at,
    }
}

function productMatchesSearch(product, categoryName, search) {
    const value = search.toLowerCase()
    const fields = [
        product.name,
        product.sku,
        product.barcode || '',
        product.description || '',
        categoryName || '',
        ...(product.tags || []).map((tag) => tag.name),
    ]
    return fields.some((field) => String(field || '').toLowerCase().includes(value))
}

function sortProducts(products, sortBy = 'updated_at', sortDir = 'desc') {
    const dir = sortDir === 'asc' ? 1 : -1
    const sorters = {
        name: (product) => String(product.name || '').toLowerCase(),
        price: (product) => Number(product.price || 0),
        quantity: (product) => Number(product.quantity || 0),
        date: (product) => String(product.created_at || ''),
        updated_at: (product) => String(product.updated_at || ''),
    }
    const getter = sorters[sortBy] || sorters.updated_at

    return [...products].sort((a, b) => {
        const left = getter(a)
        const right = getter(b)
        if (left < right) return -1 * dir
        if (left > right) return 1 * dir
        return 0
    })
}

function queryProducts(params = {}) {
    const state = loadState()
    const categories = buildCategoryMap(state.categories)

    let products = state.products.map((product) => serializeProduct(product, categories))

    if (params.search) {
        products = products.filter((product) => productMatchesSearch(product, product.category_name, params.search))
    }
    if (params.category_id !== undefined && params.category_id !== '') {
        products = products.filter((product) => String(product.category_id) === String(params.category_id))
    }
    if (params.min_price !== undefined && params.min_price !== '') {
        products = products.filter((product) => product.price >= Number(params.min_price))
    }
    if (params.max_price !== undefined && params.max_price !== '') {
        products = products.filter((product) => product.price <= Number(params.max_price))
    }
    if (params.tags) {
        const requested = String(params.tags)
            .split(',')
            .map((tag) => tag.trim().toLowerCase())
            .filter(Boolean)
        products = products.filter((product) => {
            const productTags = new Set((product.tags || []).map((tag) => tag.name.toLowerCase()))
            return requested.every((tag) => productTags.has(tag))
        })
    }
    if (params.status) {
        products = products.filter((product) => product.status === params.status)
    }

    return sortProducts(products, params.sort_by, params.sort_dir)
}

function ensureCategoryExists(state, categoryId) {
    if (!state.categories.some((category) => category.id === Number(categoryId))) {
        error('Category not found')
    }
}

function ensureUniqueSku(state, sku, currentId = null) {
    const normalizedSku = String(sku || '').trim().toLowerCase()
    const duplicate = state.products.find((product) => product.id !== currentId && String(product.sku || '').trim().toLowerCase() === normalizedSku)
    if (duplicate) error('A product with this SKU already exists')
}

function ensureUniqueBarcode(state, barcode, currentId = null) {
    if (!barcode) return
    const duplicate = state.products.find((product) => product.id !== currentId && product.barcode === barcode)
    if (duplicate) error('A product with this barcode already exists')
}

function ensureUniqueCategoryName(state, name, currentId = null) {
    const normalizedName = String(name || '').trim().toLowerCase()
    const duplicate = state.categories.find((category) => category.id !== currentId && String(category.name || '').trim().toLowerCase() === normalizedName)
    if (duplicate) error('A category with this name already exists')
}

function getStats() {
    const state = loadState()
    const categories = buildCategoryMap(state.categories)
    const products = state.products.map((product) => serializeProduct(product, categories))
    const totalValue = products.reduce((sum, product) => sum + product.inventory_value, 0)

    const tagUsage = new Map()
    for (const product of products) {
        for (const tag of product.tags || []) {
            const key = tag.name.toLowerCase()
            if (!tagUsage.has(key)) {
                tagUsage.set(key, { name: tag.name, color: tag.color, count: 0 })
            }
            tagUsage.get(key).count += 1
        }
    }

    return {
        total_products: products.length,
        total_categories: state.categories.length,
        low_stock_count: products.filter((product) => product.status === 'low_stock').length,
        out_of_stock_count: products.filter((product) => product.status === 'out_of_stock').length,
        total_inventory_value: Number(totalValue.toFixed(2)),
        category_breakdown: state.categories.map((category) => {
            const categoryProducts = products.filter((product) => product.category_id === category.id)
            return {
                name: category.name,
                count: categoryProducts.length,
                value: Number(categoryProducts.reduce((sum, product) => sum + product.inventory_value, 0).toFixed(2)),
            }
        }),
        tag_breakdown: [...tagUsage.values()].sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name)),
        recent_products: [...products]
            .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
            .slice(0, 5),
    }
}

export const api = {
    getStats: async () => getStats(),

    getProducts: async (params = {}) => queryProducts(params),

    getProduct: async (id) => {
        const product = queryProducts().find((item) => item.id === Number(id))
        if (!product) error('Product not found')
        return product
    },

    lookupProductByBarcode: async (barcode) => {
        const normalized = normalizeBarcode(barcode)
        if (!normalized) error('Barcode is required')
        const product = queryProducts().find((item) => item.barcode === normalized)
        if (!product) error('Product not found for this barcode')
        return product
    },

    createProduct: async (data) => {
        const state = loadState()
        const required = ['name', 'sku', 'price', 'category_id']
        const missing = required.filter((field) => data[field] === '' || data[field] === undefined || data[field] === null)
        if (missing.length) error(`Missing required fields: ${missing.join(', ')}`)

        ensureCategoryExists(state, data.category_id)
        const barcode = normalizeBarcode(data.barcode)
        ensureUniqueSku(state, data.sku)
        ensureUniqueBarcode(state, barcode)

        const timestamp = nowIso()
        const record = {
            id: state.counters.product++,
            name: String(data.name).trim(),
            sku: String(data.sku).trim(),
            barcode,
            description: String(data.description || ''),
            quantity: Number(data.quantity || 0),
            price: Number(data.price),
            low_stock_threshold: Number(data.low_stock_threshold || 10),
            tags: normalizeTags(data.tags),
            category_id: Number(data.category_id),
            created_at: timestamp,
            updated_at: timestamp,
        }

        state.products.push(record)
        saveState(state)
        return serializeProduct(record, buildCategoryMap(state.categories))
    },

    updateProduct: async (id, data) => {
        const state = loadState()
        const product = state.products.find((item) => item.id === Number(id))
        if (!product) error('Product not found')

        const categoryId = data.category_id !== undefined ? Number(data.category_id) : product.category_id
        ensureCategoryExists(state, categoryId)

        const barcode = data.barcode !== undefined ? normalizeBarcode(data.barcode) : product.barcode
        ensureUniqueSku(state, data.sku ?? product.sku, product.id)
        ensureUniqueBarcode(state, barcode, product.id)

        product.name = data.name ?? product.name
        product.sku = data.sku ?? product.sku
        product.barcode = barcode
        product.description = data.description ?? product.description
        product.quantity = Number(data.quantity ?? product.quantity)
        product.price = Number(data.price ?? product.price)
        product.low_stock_threshold = Number(data.low_stock_threshold ?? product.low_stock_threshold)
        product.category_id = categoryId
        if (data.tags !== undefined) {
            product.tags = normalizeTags(data.tags)
        }
        product.updated_at = nowIso()

        saveState(state)
        return serializeProduct(product, buildCategoryMap(state.categories))
    },

    deleteProduct: async (id) => {
        const state = loadState()
        const index = state.products.findIndex((item) => item.id === Number(id))
        if (index < 0) error('Product not found')
        state.products.splice(index, 1)
        saveState(state)
        return { message: 'Product deleted successfully' }
    },

    adjustStock: async (id, adjustment) => {
        const state = loadState()
        const product = state.products.find((item) => item.id === Number(id))
        if (!product) error('Product not found')
        product.quantity = Math.max(0, Number(product.quantity || 0) + Number(adjustment || 0))
        product.updated_at = nowIso()
        saveState(state)
        return serializeProduct(product, buildCategoryMap(state.categories))
    },

    bulkAssignTags: async (data) => {
        const state = loadState()
        const ids = Array.isArray(data.product_ids) ? data.product_ids.map(Number) : []
        if (!ids.length) error('No products selected')

        const tags = normalizeTags(data.tags)
        const products = state.products.filter((product) => ids.includes(product.id))
        if (!products.length) error('Products not found')

        for (const product of products) {
            if (data.mode === 'replace') {
                product.tags = tags
            } else {
                const merged = new Map((product.tags || []).map((tag) => [tag.name.toLowerCase(), tag]))
                for (const tag of tags) {
                    merged.set(tag.name.toLowerCase(), tag)
                }
                product.tags = [...merged.values()]
            }
            product.updated_at = nowIso()
        }

        saveState(state)
        const categories = buildCategoryMap(state.categories)
        return products.map((product) => serializeProduct(product, categories))
    },

    getCategories: async () => {
        const state = loadState()
        return state.categories.map((category) => serializeCategory(category, state.products))
    },

    createCategory: async (data) => {
        const state = loadState()
        if (!String(data.name || '').trim()) error('Category name is required')
        ensureUniqueCategoryName(state, data.name)

        const record = {
            id: state.counters.category++,
            name: String(data.name).trim(),
            description: String(data.description || ''),
            created_at: nowIso(),
        }
        state.categories.push(record)
        saveState(state)
        return serializeCategory(record, state.products)
    },

    updateCategory: async (id, data) => {
        const state = loadState()
        const category = state.categories.find((item) => item.id === Number(id))
        if (!category) error('Category not found')
        if (data.name !== undefined && !String(data.name).trim()) error('Category name is required')

        ensureUniqueCategoryName(state, data.name ?? category.name, category.id)
        category.name = data.name !== undefined ? String(data.name).trim() : category.name
        category.description = data.description !== undefined ? String(data.description || '') : category.description
        saveState(state)
        return serializeCategory(category, state.products)
    },

    deleteCategory: async (id) => {
        const state = loadState()
        const categoryId = Number(id)
        const category = state.categories.find((item) => item.id === categoryId)
        if (!category) error('Category not found')
        if (state.products.some((product) => product.category_id === categoryId)) {
            error('Cannot delete a category that still has products')
        }
        state.categories = state.categories.filter((item) => item.id !== categoryId)
        saveState(state)
        return { message: 'Category deleted' }
    },
}
