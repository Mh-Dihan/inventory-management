from flask import Blueprint, jsonify
from ..models import Product, Category

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/stats', methods=['GET'])
def get_stats():
    products = Product.query.all()
    total_products = len(products)
    total_categories = Category.query.count()
    low_stock = sum(1 for p in products if p._get_status() == 'low_stock')
    out_of_stock = sum(1 for p in products if p._get_status() == 'out_of_stock')
    total_value = sum(p.price * p.quantity for p in products)

    category_breakdown = []
    tag_usage = {}
    for cat in Category.query.all():
        cat_products = Product.query.filter_by(category_id=cat.id).all()
        category_breakdown.append({
            'name': cat.name,
            'count': len(cat_products),
            'value': sum(p.price * p.quantity for p in cat_products),
        })

    for product in products:
        for tag in product.get_tags():
            key = tag['name'].lower()
            if key not in tag_usage:
                tag_usage[key] = {'name': tag['name'], 'color': tag['color'], 'count': 0}
            tag_usage[key]['count'] += 1

    return jsonify({
        'total_products': total_products,
        'total_categories': total_categories,
        'low_stock_count': low_stock,
        'out_of_stock_count': out_of_stock,
        'total_inventory_value': round(total_value, 2),
        'category_breakdown': category_breakdown,
        'tag_breakdown': sorted(tag_usage.values(), key=lambda item: (-item['count'], item['name'].lower())),
        'recent_products': [p.to_dict() for p in Product.query.order_by(Product.created_at.desc()).limit(5).all()],
    })
