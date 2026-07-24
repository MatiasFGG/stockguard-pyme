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