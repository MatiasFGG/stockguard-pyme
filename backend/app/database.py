from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/stockguard_pyme"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def check_database_connection():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            return result.scalar() == 1
    except Exception:
        return False


def fetch_products():
    query = text("""
        SELECT
            id,
            name,
            description,
            barcode,
            purchase_price,
            sale_price,
            current_stock,
            minimum_stock,
            active,
            category_id,
            supplier_id
        FROM products
        ORDER BY id;
    """)

    with engine.connect() as connection:
        result = connection.execute(query)
        products = [dict(row._mapping) for row in result]

    return products

def fetch_product_by_id(product_id: int):
    query = text("""
        SELECT
            id,
            name,
            description,
            barcode,
            purchase_price,
            sale_price,
            current_stock,
            minimum_stock,
            active,
            category_id,
            supplier_id
        FROM products
        WHERE id = :product_id;
    """)

    with engine.connect() as connection:
        result = connection.execute(
            query,
            {"product_id": product_id}
        )

        product = result.fetchone()

    if product is None:
        return None

    return dict(product._mapping)

def create_product(product_data: dict):
    query = text("""
        INSERT INTO products (
            name,
            description,
            barcode,
            purchase_price,
            sale_price,
            current_stock,
            minimum_stock,
            category_id,
            supplier_id
        )
        VALUES (
            :name,
            :description,
            :barcode,
            :purchase_price,
            :sale_price,
            :current_stock,
            :minimum_stock,
            :category_id,
            :supplier_id
        )
        RETURNING
            id,
            name,
            description,
            barcode,
            purchase_price,
            sale_price,
            current_stock,
            minimum_stock,
            active,
            category_id,
            supplier_id;
    """)

    with engine.begin() as connection:
        result = connection.execute(query, product_data)
        product = result.fetchone()

    return dict(product._mapping)

