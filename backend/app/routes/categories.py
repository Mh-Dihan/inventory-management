from flask import Blueprint, request, jsonify
from ..database import db
from ..models import Category
from ..api_utils import error_response, commit_or_409

categories_bp = Blueprint('categories', __name__)


@categories_bp.route('/', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([c.to_dict() for c in categories])


@categories_bp.route('/', methods=['POST'])
def create_category():
    data = request.get_json() or {}
    if not data.get('name'):
        return error_response('Category name is required', 400)

    category = Category(name=data['name'], description=data.get('description', ''))
    db.session.add(category)
    conflict = commit_or_409('A category with this name already exists')
    if conflict:
        return conflict
    return jsonify(category.to_dict()), 201


@categories_bp.route('/<int:category_id>', methods=['PUT'])
def update_category(category_id):
    category = Category.query.get_or_404(category_id)
    data = request.get_json() or {}
    if 'name' in data and not data.get('name'):
        return error_response('Category name is required', 400)

    category.name = data.get('name', category.name)
    category.description = data.get('description', category.description)
    conflict = commit_or_409('A category with this name already exists')
    if conflict:
        return conflict
    return jsonify(category.to_dict())


@categories_bp.route('/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    category = Category.query.get_or_404(category_id)
    if category.products:
        return error_response('Cannot delete a category that still has products', 409)

    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Category deleted'})
