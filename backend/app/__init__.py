from flask import Flask
from flask_cors import CORS
from sqlalchemy import inspect, text
from .database import db
from .routes.products import products_bp
from .routes.categories import categories_bp
from .routes.dashboard import dashboard_bp


def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///inventory.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    CORS(app)
    db.init_app(app)

    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(categories_bp, url_prefix='/api/categories')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')

    with app.app_context():
        db.create_all()
        _ensure_schema()
        _seed_data()

    return app


def _seed_data():
    from .models import Category, Product
    if Category.query.count() == 0:
        cats = [
            Category(name='Electronics', description='Electronic devices & accessories'),
            Category(name='Clothing', description='Apparel and fashion'),
            Category(name='Food & Beverage', description='Consumable goods'),
            Category(name='Office Supplies', description='Stationery and office needs'),
        ]
        db.session.add_all(cats)
        db.session.commit()

    if Product.query.count() == 0:
        products = [
            Product(name='Laptop Pro 15"', sku='ELEC-001', quantity=45, price=1299.99, category_id=1, low_stock_threshold=10),
            Product(name='Wireless Mouse', sku='ELEC-002', quantity=8, price=29.99, category_id=1, low_stock_threshold=15),
            Product(name='USB-C Hub', sku='ELEC-003', quantity=120, price=49.99, category_id=1, low_stock_threshold=20),
            Product(name='Blue T-Shirt L', sku='CLO-001', quantity=3, price=19.99, category_id=2, low_stock_threshold=10),
            Product(name='Denim Jeans 32', sku='CLO-002', quantity=60, price=59.99, category_id=2, low_stock_threshold=10),
            Product(name='Coffee Beans 1kg', sku='FB-001', quantity=200, price=14.99, category_id=3, low_stock_threshold=30),
            Product(name='Green Tea Pack', sku='FB-002', quantity=5, price=8.99, category_id=3, low_stock_threshold=20),
            Product(name='Ballpoint Pens (10pk)', sku='OFF-001', quantity=300, price=4.99, category_id=4, low_stock_threshold=50),
        ]
        products[0].set_tags([{'name': 'Featured', 'color': '#f0c040'}, {'name': 'Premium', 'color': '#9f7aea'}])
        products[1].set_tags([{'name': 'Low Margin', 'color': '#ed8936'}])
        products[2].set_tags([{'name': 'Bundle', 'color': '#4fd1c5'}])
        products[3].set_tags([{'name': 'Seasonal', 'color': '#f56565'}])
        products[5].set_tags([{'name': 'Top Seller', 'color': '#68d391'}])
        db.session.add_all(products)
        db.session.commit()


def _ensure_schema():
    inspector = inspect(db.engine)
    product_columns = {column['name'] for column in inspector.get_columns('products')}

    if 'tags_json' not in product_columns:
        with db.engine.begin() as connection:
            connection.execute(text("ALTER TABLE products ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]'"))

    if 'barcode' not in product_columns:
        with db.engine.begin() as connection:
            connection.execute(text("ALTER TABLE products ADD COLUMN barcode VARCHAR(64)"))
