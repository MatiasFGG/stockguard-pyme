from decimal import Decimal
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

def adjust_product_stock(adjustment_data: dict):
    product_query = text("""
        SELECT
            id,
            name,
            current_stock
        FROM products
        WHERE id = :product_id
        FOR UPDATE;
    """)

    update_stock_query = text("""
        UPDATE products
        SET current_stock = :new_stock
        WHERE id = :product_id
        RETURNING
            id,
            name,
            current_stock;
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
            :movement_type,
            :quantity,
            :reason,
            :reference
        )
        RETURNING
            id,
            product_id,
            movement_type,
            quantity,
            movement_date,
            reason,
            reference;
    """)

    product_id = adjustment_data["product_id"]
    movement_type = adjustment_data["movement_type"]
    quantity = adjustment_data["quantity"]

    with engine.begin() as connection:
        product_result = connection.execute(
            product_query,
            {"product_id": product_id}
        )

        product = product_result.fetchone()

        if product is None:
            return {
                "error": "PRODUCT_NOT_FOUND"
            }

        current_stock = product._mapping["current_stock"]

        if movement_type == "AJUSTE_POSITIVO":
            new_stock = current_stock + quantity
        elif movement_type in ["AJUSTE_NEGATIVO", "MERMA"]:
            new_stock = current_stock - quantity
        else:
            return {
                "error": "INVALID_MOVEMENT_TYPE"
            }

        if new_stock < 0:
            return {
                "error": "NEGATIVE_STOCK"
            }

        updated_product_result = connection.execute(
            update_stock_query,
            {
                "product_id": product_id,
                "new_stock": new_stock
            }
        )

        updated_product = dict(updated_product_result.fetchone()._mapping)

        movement_result = connection.execute(
            create_movement_query,
            {
                "product_id": product_id,
                "movement_type": movement_type,
                "quantity": quantity,
                "reason": adjustment_data["reason"],
                "reference": adjustment_data.get("reference")
            }
        )

        movement = dict(movement_result.fetchone()._mapping)

    return {
        "product": updated_product,
        "movement": movement
    }
    
def create_sale(sale_data: dict):
    product_query = text("""
        SELECT
            id,
            name,
            sale_price,
            current_stock,
            active
        FROM products
        WHERE id = :product_id
        FOR UPDATE;
    """)

    create_sale_query = text("""
        INSERT INTO sales (
            total,
            payment_method,
            observation
        )
        VALUES (
            :total,
            :payment_method,
            :observation
        )
        RETURNING
            id,
            sale_date,
            total,
            payment_method,
            observation;
    """)

    create_detail_query = text("""
        INSERT INTO sale_details (
            sale_id,
            product_id,
            quantity,
            unit_price,
            subtotal
        )
        VALUES (
            :sale_id,
            :product_id,
            :quantity,
            :unit_price,
            :subtotal
        )
        RETURNING
            id,
            sale_id,
            product_id,
            quantity,
            unit_price,
            subtotal;
    """)

    update_stock_query = text("""
        UPDATE products
        SET current_stock = current_stock - :quantity
        WHERE id = :product_id;
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
            'VENTA',
            :quantity,
            :reason,
            :reference
        );
    """)

    items = sale_data["items"]
    product_ids = set()

    for item in items:
        product_id = item["product_id"]

        if product_id in product_ids:
            return {
                "error": "DUPLICATE_PRODUCT",
                "product_id": product_id
            }

        product_ids.add(product_id)

    with engine.begin() as connection:
        prepared_items = []
        total = Decimal("0.00")

        for item in items:
            product_result = connection.execute(
                product_query,
                {
                    "product_id": item["product_id"]
                }
            )

            product = product_result.fetchone()

            if product is None:
                return {
                    "error": "PRODUCT_NOT_FOUND",
                    "product_id": item["product_id"]
                }

            product_data = product._mapping

            if not product_data["active"]:
                return {
                    "error": "INACTIVE_PRODUCT",
                    "product_id": product_data["id"]
                }

            if product_data["current_stock"] < item["quantity"]:
                return {
                    "error": "INSUFFICIENT_STOCK",
                    "product_id": product_data["id"],
                    "product_name": product_data["name"],
                    "available_stock": product_data["current_stock"],
                    "requested_quantity": item["quantity"]
                }

            subtotal = product_data["sale_price"] * item["quantity"]
            total += subtotal

            prepared_items.append({
                "product_id": product_data["id"],
                "product_name": product_data["name"],
                "quantity": item["quantity"],
                "unit_price": product_data["sale_price"],
                "subtotal": subtotal
            })

        sale_result = connection.execute(
            create_sale_query,
            {
                "total": total,
                "payment_method": sale_data["payment_method"],
                "observation": sale_data.get("observation")
            }
        )

        sale = dict(sale_result.fetchone()._mapping)
        sale_details = []

        for item in prepared_items:
            detail_result = connection.execute(
                create_detail_query,
                {
                    "sale_id": sale["id"],
                    "product_id": item["product_id"],
                    "quantity": item["quantity"],
                    "unit_price": item["unit_price"],
                    "subtotal": item["subtotal"]
                }
            )

            detail = dict(detail_result.fetchone()._mapping)
            detail["product_name"] = item["product_name"]
            sale_details.append(detail)

            connection.execute(
                update_stock_query,
                {
                    "product_id": item["product_id"],
                    "quantity": item["quantity"]
                }
            )

            connection.execute(
                create_movement_query,
                {
                    "product_id": item["product_id"],
                    "quantity": item["quantity"],
                    "reason": "Venta registrada",
                    "reference": f"SALE-{sale['id']}"
                }
            )

    return {
        "sale": sale,
        "details": sale_details
    }    