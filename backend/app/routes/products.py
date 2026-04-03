from flask import Blueprint, request, jsonify
from ..database import db
from ..models import Product, Category
from ..api_utils import error_response, commit_or_409
from sqlalchemy import or_

products_bp = Blueprint('products', __name__)


def _normalize_barcode(value):
    barcode = str(value or '').strip()
    return barcode or None


def _barcode_conflict(barcode, current_product_id=None):
    if not barcode:
        return None

    query = Product.query.filter(Product.barcode == barcode)
    if current_product_id is not None:
        query = query.filter(Product.id != current_product_id)

    if query.first():
        return error_response('A product with this barcode already exists', 409)
    return None


@products_bp.route('/', methods=['GET'])
def get_products():
    search = request.args.get('search', '')
    category_id = request.args.get('category_id')
    status = request.args.get('status')
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    tag_query = request.args.get('tags', '')
    sort_by = request.args.get('sort_by', 'updated_at')
    sort_dir = request.args.get('sort_dir', 'desc').lower()

    query = Product.query.outerjoin(Category)
    if search:
        search_term = f'%{search}%'
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.sku.ilike(search_term),
                Product.barcode.ilike(search_term),
                Product.description.ilike(search_term),
                Category.name.ilike(search_term),
            )
        )
    if category_id:
        query = query.filter(Product.category_id == int(category_id))
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    sort_map = {
        'name': Product.name,
        'price': Product.price,
        'quantity': Product.quantity,
        'date': Product.created_at,
        'updated_at': Product.updated_at,
    }
    sort_column = sort_map.get(sort_by, Product.updated_at)
    query = query.order_by(sort_column.asc() if sort_dir == 'asc' else sort_column.desc())

    products = query.all()

    tag_names = [tag.strip().lower() for tag in tag_query.split(',') if tag.strip()]
    if tag_names:
        products = [
            product for product in products
            if all(
                tag_name in {tag['name'].lower() for tag in product.get_tags()}
                for tag_name in tag_names
            )
        ]
    elif search:
        search_lower = search.lower()
        products = [
            product for product in products
            if (
                search_lower in (product.name or '').lower()
                or search_lower in (product.sku or '').lower()
                or search_lower in (product.barcode or '').lower()
                or search_lower in (product.description or '').lower()
                or search_lower in (product.category.name if product.category else '').lower()
                or any(search_lower in tag['name'].lower() for tag in product.get_tags())
            )
        ]

    if status == 'low_stock':
        products = [p for p in products if p._get_status() == 'low_stock']
    elif status == 'out_of_stock':
        products = [p for p in products if p._get_status() == 'out_of_stock']
    elif status == 'in_stock':
        products = [p for p in products if p._get_status() == 'in_stock']

    return jsonify([p.to_dict() for p in products])


@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify(product.to_dict())


@products_bp.route('/lookup', methods=['GET'])
def lookup_product():
    barcode = _normalize_barcode(request.args.get('barcode'))
    if not barcode:
        return error_response('Barcode is required', 400)

    product = Product.query.filter(Product.barcode == barcode).first()
    if not product:
        return error_response('Product not found for this barcode', 404)

    return jsonify(product.to_dict())


@products_bp.route('/', methods=['POST'])
def create_product():
    data = request.get_json() or {}
    required_fields = ['name', 'sku', 'price', 'category_id']
    missing_fields = [field for field in required_fields if data.get(field) in (None, '')]
    if missing_fields:
        return error_response(f"Missing required fields: {', '.join(missing_fields)}", 400)

    category = Category.query.get(data['category_id'])
    if not category:
        return error_response('Category not found', 404)

    barcode = _normalize_barcode(data.get('barcode'))
    conflict = _barcode_conflict(barcode)
    if conflict:
        return conflict

    product = Product(
        name=data['name'],
        sku=data['sku'],
        barcode=barcode,
        description=data.get('description', ''),
        quantity=int(data.get('quantity', 0)),
        price=float(data['price']),
        low_stock_threshold=int(data.get('low_stock_threshold', 10)),
        category_id=int(data['category_id']),
    )
    product.set_tags(data.get('tags', []))
    db.session.add(product)
    conflict = commit_or_409('A product with this SKU already exists')
    if conflict:
        return conflict
    return jsonify(product.to_dict()), 201


@products_bp.route('/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    product = Product.query.get_or_404(product_id)
    data = request.get_json() or {}

    if 'category_id' in data:
        category = Category.query.get(data['category_id'])
        if not category:
            return error_response('Category not found', 404)

    if 'barcode' in data:
        barcode = _normalize_barcode(data.get('barcode'))
        conflict = _barcode_conflict(barcode, product.id)
        if conflict:
            return conflict
        product.barcode = barcode

    product.name = data.get('name', product.name)
    product.sku = data.get('sku', product.sku)
    product.description = data.get('description', product.description)
    product.quantity = int(data.get('quantity', product.quantity))
    product.price = float(data.get('price', product.price))
    product.low_stock_threshold = int(data.get('low_stock_threshold', product.low_stock_threshold))
    product.category_id = int(data.get('category_id', product.category_id))
    if 'tags' in data:
        product.set_tags(data.get('tags', []))

    conflict = commit_or_409('A product with this SKU already exists')
    if conflict:
        return conflict
    return jsonify(product.to_dict())


@products_bp.route('/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    return jsonify({'message': 'Product deleted successfully'})


@products_bp.route('/<int:product_id>/adjust', methods=['PATCH'])
def adjust_stock(product_id):
    product = Product.query.get_or_404(product_id)
    data = request.get_json() or {}
    adjustment = int(data.get('adjustment', 0))
    product.quantity = max(0, product.quantity + adjustment)
    db.session.commit()
    return jsonify(product.to_dict())


@products_bp.route('/bulk-tags', methods=['POST'])
def bulk_assign_tags():
    data = request.get_json() or {}
    product_ids = data.get('product_ids') or []
    tags = Product.normalize_tags(data.get('tags', []))
    mode = data.get('mode', 'append')

    if not product_ids:
        return error_response('No products selected', 400)

    products = Product.query.filter(Product.id.in_(product_ids)).all()
    if not products:
        return error_response('Products not found', 404)

    for product in products:
        if mode == 'replace':
            product.set_tags(tags)
            continue

        merged = {tag['name'].lower(): tag for tag in product.get_tags()}
        for tag in tags:
            merged[tag['name'].lower()] = tag
        product.set_tags(list(merged.values()))

    db.session.commit()
    return jsonify([product.to_dict() for product in products])
