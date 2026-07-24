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
    create_product_query = text("""
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

    create_movement_query = text("""
        INSERT INTO inventory_movements (
            product_id,
            movement_type,
            quantity,
            reason,
            reference
        )
        VALUES (
            :product_id,
            'ENTRADA',
            :quantity,
            :reason,
            :reference
        );
    """)

    with engine.begin() as connection:
        result = connection.execute(create_product_query, product_data)
        product = result.fetchone()
        created_product = dict(product._mapping)

        if created_product["current_stock"] > 0:
            connection.execute(
                create_movement_query,
                {
                    "product_id": created_product["id"],
                    "quantity": created_product["current_stock"],
                    "reason": "Stock inicial al crear producto",
                    "reference": "PRODUCT_CREATE"
                }
            )

    return created_product

def fetch_inventory_movements():
    query = text("""
        SELECT
            im.id,
            im.product_id,
            p.name AS product_name,
            im.movement_type,
            im.quantity,
            im.movement_date,
            im.reason,
            im.reference
        FROM inventory_movements im
        INNER JOIN products p
            ON im.product_id = p.id
        ORDER BY im.id DESC;
    """)

    with engine.connect() as connection:
        result = connection.execute(query)
        movements = [dict(row._mapping) for row in result]

    return movements