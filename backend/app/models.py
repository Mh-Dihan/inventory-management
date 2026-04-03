from .database import db
from datetime import datetime
import json


class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    products = db.relationship('Product', backref='category', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'product_count': len(self.products),
            'created_at': self.created_at.isoformat(),
        }


class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    sku = db.Column(db.String(50), unique=True, nullable=False)
    barcode = db.Column(db.String(64))
    description = db.Column(db.Text)
    quantity = db.Column(db.Integer, default=0)
    price = db.Column(db.Float, nullable=False)
    low_stock_threshold = db.Column(db.Integer, default=10)
    tags_json = db.Column(db.Text, nullable=False, default='[]')
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'sku': self.sku,
            'barcode': self.barcode,
            'description': self.description,
            'quantity': self.quantity,
            'price': self.price,
            'low_stock_threshold': self.low_stock_threshold,
            'tags': self.get_tags(),
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'status': self._get_status(),
            'inventory_value': round((self.price or 0) * (self.quantity or 0), 2),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def get_tags(self):
        try:
            raw_tags = json.loads(self.tags_json or '[]')
        except (TypeError, json.JSONDecodeError):
            raw_tags = []

        normalized = []
        seen = set()
        for tag in raw_tags:
            if isinstance(tag, str):
                name = tag.strip()
                color = '#4fd1c5'
            elif isinstance(tag, dict):
                name = str(tag.get('name', '')).strip()
                color = str(tag.get('color', '#4fd1c5')).strip() or '#4fd1c5'
            else:
                continue

            key = name.lower()
            if not name or key in seen:
                continue
            seen.add(key)
            normalized.append({'name': name, 'color': color})

        return normalized

    def set_tags(self, tags):
        self.tags_json = json.dumps(self.normalize_tags(tags))

    @staticmethod
    def normalize_tags(tags):
        normalized = []
        seen = set()

        for tag in tags or []:
            if isinstance(tag, str):
                name = tag.strip()
                color = '#4fd1c5'
            elif isinstance(tag, dict):
                name = str(tag.get('name', '')).strip()
                color = str(tag.get('color', '#4fd1c5')).strip() or '#4fd1c5'
            else:
                continue

            key = name.lower()
            if not name or key in seen:
                continue
            seen.add(key)
            normalized.append({'name': name, 'color': color})

        return normalized

    def _get_status(self):
        if self.quantity == 0:
            return 'out_of_stock'
        elif self.quantity <= self.low_stock_threshold:
            return 'low_stock'
        return 'in_stock'
