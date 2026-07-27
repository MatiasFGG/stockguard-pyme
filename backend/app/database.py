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


def fetch_products(
    search: str | None = None,
    category_id: int | None = None,
    supplier_id: int | None = None,
    active: bool | None = None
):
    base_query = """
        SELECT
            p.id,
            p.name,
            p.description,
            p.barcode,
            p.purchase_price,
            p.sale_price,
            p.current_stock,
            p.minimum_stock,
            p.active,
            p.category_id,
            c.name AS category_name,
            p.supplier_id,
            s.name AS supplier_name
        FROM products p
        INNER JOIN categories c
            ON p.category_id = c.id
        LEFT JOIN suppliers s
            ON p.supplier_id = s.id
    """

    where_clauses = []
    params = {}

    if search is not None and search.strip() != "":
        where_clauses.append("""
            (
                p.name ILIKE :search_pattern
                OR p.description ILIKE :search_pattern
                OR p.barcode ILIKE :search_pattern
            )
        """)
        params["search_pattern"] = f"%{search}%"

    if category_id is not None:
        where_clauses.append("p.category_id = :category_id")
        params["category_id"] = category_id

    if supplier_id is not None:
        where_clauses.append("p.supplier_id = :supplier_id")
        params["supplier_id"] = supplier_id

    if active is not None:
        where_clauses.append("p.active = :active")
        params["active"] = active

    if where_clauses:
        base_query += " WHERE " + " AND ".join(where_clauses)

    base_query += " ORDER BY p.id;"

    query = text(base_query)

    with engine.connect() as connection:
        result = connection.execute(query, params)
        products = [dict(row._mapping) for row in result]

    return products

def fetch_product_by_id(product_id: int):
    query = text("""
        SELECT
            p.id,
            p.name,
            p.description,
            p.barcode,
            p.purchase_price,
            p.sale_price,
            p.current_stock,
            p.minimum_stock,
            p.active,
            p.category_id,
            c.name AS category_name,
            p.supplier_id,
            s.name AS supplier_name
        FROM products p
        INNER JOIN categories c
            ON p.category_id = c.id
        LEFT JOIN suppliers s
            ON p.supplier_id = s.id
        WHERE p.id = :product_id;
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

def create_product(
    product_data: dict,
    user_id: int
):
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
            reference,
            performed_by_user_id
        )
        VALUES (
            :product_id,
            'ENTRADA',
            :quantity,
            :reason,
            :reference,
            :performed_by_user_id
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
                    "reference": "PRODUCT_CREATE",
                    "performed_by_user_id": user_id
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
            im.reference,
            im.performed_by_user_id,
            u.full_name AS performed_by_full_name,
            u.username AS performed_by_username
        FROM inventory_movements im
        INNER JOIN products p
            ON im.product_id = p.id
        LEFT JOIN users u
            ON im.performed_by_user_id = u.id
        ORDER BY im.id DESC;
    """)

    with engine.connect() as connection:
        result = connection.execute(query)

        movements = [
            dict(row._mapping)
            for row in result
        ]

    return movements

def adjust_product_stock(
    adjustment_data: dict,
    user_id: int
):
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
            reference,
            performed_by_user_id
        )
        VALUES (
            :product_id,
            :movement_type,
            :quantity,
            :reason,
            :reference,
            :performed_by_user_id
        )
        RETURNING
            id,
            product_id,
            movement_type,
            quantity,
            movement_date,
            reason,
            reference,
            performed_by_user_id;
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
                "reference": adjustment_data.get("reference"),
                "performed_by_user_id": user_id
            }
        )

        movement = dict(movement_result.fetchone()._mapping)

    return {
        "product": updated_product,
        "movement": movement
    }
    
def create_sale(
    sale_data: dict,
    user_id: int
):
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
            document_type,
            document_number,
            observation,
            created_by_user_id
        )
        VALUES (
            :total,
            :payment_method,
            :document_type,
            :document_number,
            :observation,
            :created_by_user_id
        )
    RETURNING
        id,
        sale_date,
        total,
        payment_method,
        document_type,
        document_number,
        observation,
        created_by_user_id;
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
            reference,
            performed_by_user_id
        )
        VALUES (
            :product_id,
            'VENTA',
            :quantity,
            :reason,
            :reference,
            :performed_by_user_id
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
                "document_type": sale_data.get("document_type"),
                "document_number": sale_data.get("document_number"),
                "observation": sale_data.get("observation"),
                "created_by_user_id": user_id
            })

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
                    "reference": f"SALE-{sale['id']}",
                    "performed_by_user_id": user_id
                }
            )

    return {
        "sale": sale,
        "details": sale_details
    }    
    
def fetch_sales(
    payment_method: str | None = None,
    document_type: str | None = None,
    document_number: str | None = None,
    date_from=None,
    date_to=None
):
    base_query = """
        SELECT
            s.id,
            s.sale_date,
            s.total,
            s.payment_method,
            s.document_type,
            s.document_number,
            s.observation,
            s.created_by_user_id,
            u.full_name AS created_by_full_name,
            u.username AS created_by_username,
            COUNT(sd.id) AS total_products,
            COALESCE(SUM(sd.quantity), 0) AS total_items
        FROM sales s
        LEFT JOIN sale_details sd
            ON s.id = sd.sale_id
        LEFT JOIN users u
            ON s.created_by_user_id = u.id
            
    """

    where_clauses = []
    params = {}

    if payment_method is not None:
        where_clauses.append("s.payment_method = :payment_method")
        params["payment_method"] = payment_method

    if document_type is not None:
        where_clauses.append("s.document_type = :document_type")
        params["document_type"] = document_type

    if document_number is not None and document_number.strip() != "":
        where_clauses.append("s.document_number ILIKE :document_number_pattern")
        params["document_number_pattern"] = f"%{document_number}%"

    if date_from is not None:
        where_clauses.append("s.sale_date::date >= :date_from")
        params["date_from"] = date_from

    if date_to is not None:
        where_clauses.append("s.sale_date::date <= :date_to")
        params["date_to"] = date_to

    if where_clauses:
        base_query += " WHERE " + " AND ".join(where_clauses)

    base_query += """
        GROUP BY
            s.id,
            s.sale_date,
            s.total,
            s.payment_method,
            s.document_type,
            s.document_number,
            s.observation,
            s.created_by_user_id,
            u.full_name,
            u.username
        ORDER BY s.id DESC;
    """

    query = text(base_query)

    with engine.connect() as connection:
        result = connection.execute(query, params)
        sales = [dict(row._mapping) for row in result]

    return sales


def fetch_sale_by_id(sale_id: int):
    sale_query = text("""
        SELECT
            s.id,
            s.sale_date,
            s.total,
            s.payment_method,
            s.document_type,
            s.document_number,
            s.observation,
            s.created_by_user_id,
            u.full_name AS created_by_full_name,
            u.username AS created_by_username
        FROM sales s
        LEFT JOIN users u
            ON s.created_by_user_id = u.id
        WHERE s.id = :sale_id;
    """)

    details_query = text("""
        SELECT
            sd.id,
            sd.sale_id,
            sd.product_id,
            p.name AS product_name,
            sd.quantity,
            sd.unit_price,
            sd.subtotal
        FROM sale_details sd
        INNER JOIN products p
            ON sd.product_id = p.id
        WHERE sd.sale_id = :sale_id
        ORDER BY sd.id;
    """)

    with engine.connect() as connection:
        sale_result = connection.execute(
            sale_query,
            {"sale_id": sale_id}
        )

        sale = sale_result.fetchone()

        if sale is None:
            return None

        details_result = connection.execute(
            details_query,
            {"sale_id": sale_id}
        )

        details = [dict(row._mapping) for row in details_result]

    return {
        "sale": dict(sale._mapping),
        "details": details
    }    
    
def fetch_categories():
    query = text("""
        SELECT
            id,
            name,
            description,
            active
        FROM categories
        ORDER BY id;
    """)

    with engine.connect() as connection:
        result = connection.execute(query)
        categories = [dict(row._mapping) for row in result]

    return categories


def create_category(category_data: dict):
    query = text("""
        INSERT INTO categories (
            name,
            description
        )
        VALUES (
            :name,
            :description
        )
        RETURNING
            id,
            name,
            description,
            active;
    """)

    with engine.begin() as connection:
        result = connection.execute(query, category_data)
        category = result.fetchone()

    return dict(category._mapping)


def fetch_suppliers():
    query = text("""
        SELECT
            id,
            name,
            phone,
            email,
            address,
            active
        FROM suppliers
        ORDER BY id;
    """)

    with engine.connect() as connection:
        result = connection.execute(query)
        suppliers = [dict(row._mapping) for row in result]

    return suppliers


def create_supplier(supplier_data: dict):
    query = text("""
        INSERT INTO suppliers (
            name,
            phone,
            email,
            address
        )
        VALUES (
            :name,
            :phone,
            :email,
            :address
        )
        RETURNING
            id,
            name,
            phone,
            email,
            address,
            active;
    """)

    with engine.begin() as connection:
        result = connection.execute(query, supplier_data)
        supplier = result.fetchone()

    return dict(supplier._mapping)    

def deactivate_product(product_id: int):
    query = text("""
        UPDATE products
        SET active = false
        WHERE id = :product_id
        RETURNING id;
    """)

    with engine.begin() as connection:
        result = connection.execute(
            query,
            {"product_id": product_id}
        )

        product = result.fetchone()

    if product is None:
        return None

    return fetch_product_by_id(product_id)


def activate_product(product_id: int):
    query = text("""
        UPDATE products
        SET active = true
        WHERE id = :product_id
        RETURNING id;
    """)

    with engine.begin() as connection:
        result = connection.execute(
            query,
            {"product_id": product_id}
        )

        product = result.fetchone()

    if product is None:
        return None

    return fetch_product_by_id(product_id)

def fetch_low_stock_products():
    query = text("""
        SELECT
            p.id,
            p.name,
            p.description,
            p.barcode,
            p.purchase_price,
            p.sale_price,
            p.current_stock,
            p.minimum_stock,
            p.active,
            p.category_id,
            c.name AS category_name,
            p.supplier_id,
            s.name AS supplier_name
        FROM products p
        INNER JOIN categories c
            ON p.category_id = c.id
        LEFT JOIN suppliers s
            ON p.supplier_id = s.id
        WHERE
            p.active = true
            AND p.current_stock <= p.minimum_stock
        ORDER BY p.current_stock ASC;
    """)

    with engine.connect() as connection:
        result = connection.execute(query)
        products = [dict(row._mapping) for row in result]

    return products

def fetch_sales_summary(date_from=None, date_to=None):
    base_query = """
        WITH filtered_sales AS (
            SELECT
                id,
                total
            FROM sales s
    """

    where_clauses = []
    params = {}

    if date_from is not None:
        where_clauses.append("s.sale_date::date >= :date_from")
        params["date_from"] = date_from

    if date_to is not None:
        where_clauses.append("s.sale_date::date <= :date_to")
        params["date_to"] = date_to

    if where_clauses:
        base_query += " WHERE " + " AND ".join(where_clauses)

    base_query += """
        )
        SELECT
            COALESCE(
                (
                    SELECT SUM(total)
                    FROM filtered_sales
                ),
                0
            ) AS total_sales_amount,

            (
                SELECT COUNT(*)
                FROM filtered_sales
            ) AS total_sales,

            COALESCE(
                (
                    SELECT SUM(sd.quantity)
                    FROM sale_details sd
                    INNER JOIN filtered_sales fs
                        ON sd.sale_id = fs.id
                ),
                0
            ) AS total_items_sold,

            CASE
                WHEN (
                    SELECT COUNT(*)
                    FROM filtered_sales
                ) = 0 THEN 0
                ELSE ROUND(
                    (
                        SELECT COALESCE(SUM(total), 0)
                        FROM filtered_sales
                    ) / (
                        SELECT COUNT(*)
                        FROM filtered_sales
                    ),
                    2
                )
            END AS average_sale_amount;
    """

    query = text(base_query)

    with engine.connect() as connection:
        result = connection.execute(query, params)
        summary = result.fetchone()

    return dict(summary._mapping)


def fetch_top_products(
    limit: int,
    date_from=None,
    date_to=None
):
    base_query = """
        WITH filtered_sales AS (
            SELECT id
            FROM sales s
    """

    where_clauses = []
    params = {
        "limit": limit
    }

    if date_from is not None:
        where_clauses.append("s.sale_date::date >= :date_from")
        params["date_from"] = date_from

    if date_to is not None:
        where_clauses.append("s.sale_date::date <= :date_to")
        params["date_to"] = date_to

    if where_clauses:
        base_query += " WHERE " + " AND ".join(where_clauses)

    base_query += """
        )
        SELECT
            p.id AS product_id,
            p.name AS product_name,
            COALESCE(SUM(sd.quantity), 0) AS total_quantity_sold,
            COALESCE(SUM(sd.subtotal), 0) AS total_amount_sold
        FROM sale_details sd
        INNER JOIN filtered_sales fs
            ON sd.sale_id = fs.id
        INNER JOIN products p
            ON sd.product_id = p.id
        GROUP BY
            p.id,
            p.name
        ORDER BY
            total_quantity_sold DESC,
            total_amount_sold DESC
        LIMIT :limit;
    """

    query = text(base_query)

    with engine.connect() as connection:
        result = connection.execute(query, params)
        products = [dict(row._mapping) for row in result]

    return products

def update_product(product_id: int, product_data: dict):
    product_query = text("""
        SELECT id
        FROM products
        WHERE id = :product_id;
    """)

    category_query = text("""
        SELECT id
        FROM categories
        WHERE id = :category_id;
    """)

    supplier_query = text("""
        SELECT id
        FROM suppliers
        WHERE id = :supplier_id;
    """)

    update_query = text("""
        UPDATE products
        SET
            name = COALESCE(:name, name),
            description = COALESCE(:description, description),
            barcode = COALESCE(:barcode, barcode),
            purchase_price = COALESCE(:purchase_price, purchase_price),
            sale_price = COALESCE(:sale_price, sale_price),
            minimum_stock = COALESCE(:minimum_stock, minimum_stock),
            category_id = COALESCE(:category_id, category_id),
            supplier_id = COALESCE(:supplier_id, supplier_id)
        WHERE id = :product_id
        RETURNING id;
    """)

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

        if product_data.get("category_id") is not None:
            category_result = connection.execute(
                category_query,
                {"category_id": product_data["category_id"]}
            )

            category = category_result.fetchone()

            if category is None:
                return {
                    "error": "CATEGORY_NOT_FOUND"
                }

        if product_data.get("supplier_id") is not None:
            supplier_result = connection.execute(
                supplier_query,
                {"supplier_id": product_data["supplier_id"]}
            )

            supplier = supplier_result.fetchone()

            if supplier is None:
                return {
                    "error": "SUPPLIER_NOT_FOUND"
                }

        connection.execute(
            update_query,
            {
                "product_id": product_id,
                **product_data
            }
        )

    return fetch_product_by_id(product_id)

def update_category(category_id: int, category_data: dict):
    category_query = text("""
        SELECT id
        FROM categories
        WHERE id = :category_id;
    """)

    update_query = text("""
        UPDATE categories
        SET
            name = COALESCE(:name, name),
            description = COALESCE(:description, description)
        WHERE id = :category_id
        RETURNING
            id,
            name,
            description,
            active;
    """)

    with engine.begin() as connection:
        category_result = connection.execute(
            category_query,
            {"category_id": category_id}
        )

        category = category_result.fetchone()

        if category is None:
            return {
                "error": "CATEGORY_NOT_FOUND"
            }

        result = connection.execute(
            update_query,
            {
                "category_id": category_id,
                **category_data
            }
        )

        updated_category = result.fetchone()

    return dict(updated_category._mapping)


def update_supplier(supplier_id: int, supplier_data: dict):
    supplier_query = text("""
        SELECT id
        FROM suppliers
        WHERE id = :supplier_id;
    """)

    update_query = text("""
        UPDATE suppliers
        SET
            name = COALESCE(:name, name),
            phone = COALESCE(:phone, phone),
            email = COALESCE(:email, email),
            address = COALESCE(:address, address)
        WHERE id = :supplier_id
        RETURNING
            id,
            name,
            phone,
            email,
            address,
            active;
    """)

    with engine.begin() as connection:
        supplier_result = connection.execute(
            supplier_query,
            {"supplier_id": supplier_id}
        )

        supplier = supplier_result.fetchone()

        if supplier is None:
            return {
                "error": "SUPPLIER_NOT_FOUND"
            }

        result = connection.execute(
            update_query,
            {
                "supplier_id": supplier_id,
                **supplier_data
            }
        )

        updated_supplier = result.fetchone()

    return dict(updated_supplier._mapping)

def fetch_user_by_username(username: str):
    query = text("""
        SELECT
            id,
            full_name,
            username,
            email,
            password_hash,
            role,
            active,
            must_change_password,
            created_at,
            updated_at,
            last_login_at
        FROM users
        WHERE LOWER(username) = LOWER(:username);
    """)

    with engine.connect() as connection:
        result = connection.execute(
            query,
            {
                "username": username.strip()
            }
        )

        user = result.fetchone()

    if user is None:
        return None

    return dict(user._mapping)


def fetch_user_by_id(user_id: int):
    query = text("""
        SELECT
            id,
            full_name,
            username,
            email,
            role,
            active,
            must_change_password,
            created_at,
            updated_at,
            last_login_at
        FROM users
        WHERE id = :user_id;
    """)

    with engine.connect() as connection:
        result = connection.execute(
            query,
            {
                "user_id": user_id
            }
        )

        user = result.fetchone()

    if user is None:
        return None

    return dict(user._mapping)


def create_user(user_data: dict):
    query = text("""
        INSERT INTO users (
            full_name,
            username,
            email,
            password_hash,
            role,
            active,
            must_change_password
        )
        VALUES (
            :full_name,
            :username,
            :email,
            :password_hash,
            :role,
            :active,
            :must_change_password
        )
        RETURNING
            id,
            full_name,
            username,
            email,
            role,
            active,
            must_change_password,
            created_at,
            updated_at,
            last_login_at;
    """)

    normalized_data = {
        **user_data,
        "full_name": user_data["full_name"].strip(),
        "username": user_data["username"].strip(),
        "email": (
            user_data["email"].strip().lower()
            if user_data.get("email")
            else None
        )
    }

    with engine.begin() as connection:
        result = connection.execute(
            query,
            normalized_data
        )

        user = result.fetchone()

    return dict(user._mapping)

def update_user_last_login(user_id: int):
    query = text("""
        UPDATE users
        SET
            last_login_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :user_id
        RETURNING last_login_at;
    """)

    with engine.begin() as connection:
        result = connection.execute(
            query,
            {
                "user_id": user_id
            }
        )

        updated_user = result.fetchone()

    if updated_user is None:
        return None

    return updated_user._mapping["last_login_at"]

def fetch_users():
    query = text("""
        SELECT
            id,
            full_name,
            username,
            email,
            role,
            active,
            must_change_password,
            created_at,
            updated_at,
            last_login_at
        FROM users
        ORDER BY id;
    """)

    with engine.connect() as connection:
        result = connection.execute(query)

        users = [
            dict(row._mapping)
            for row in result
        ]

    return users

def update_user(user_id: int, user_data: dict):
    allowed_fields = {
        "full_name",
        "email",
        "role"
    }

    fields_to_update = {
        key: value
        for key, value in user_data.items()
        if key in allowed_fields
    }

    if not fields_to_update:
        return fetch_user_by_id(user_id)

    assignments = [
        f"{field} = :{field}"
        for field in fields_to_update
    ]

    assignments.append(
        "updated_at = CURRENT_TIMESTAMP"
    )

    query = text(f"""
        UPDATE users
        SET {", ".join(assignments)}
        WHERE id = :user_id
        RETURNING id;
    """)

    params = {
        "user_id": user_id,
        **fields_to_update
    }

    with engine.begin() as connection:
        result = connection.execute(
            query,
            params
        )

        updated_user = result.fetchone()

    if updated_user is None:
        return None

    return fetch_user_by_id(user_id)


def update_user_status(
    user_id: int,
    active: bool
):
    query = text("""
        UPDATE users
        SET
            active = :active,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :user_id
        RETURNING id;
    """)

    with engine.begin() as connection:
        result = connection.execute(
            query,
            {
                "user_id": user_id,
                "active": active
            }
        )

        updated_user = result.fetchone()

    if updated_user is None:
        return None

    return fetch_user_by_id(user_id)


def update_user_password(
    user_id: int,
    password_hash: str,
    must_change_password: bool
):
    query = text("""
        UPDATE users
        SET
            password_hash = :password_hash,
            must_change_password = :must_change_password,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :user_id
        RETURNING id;
    """)

    with engine.begin() as connection:
        result = connection.execute(
            query,
            {
                "user_id": user_id,
                "password_hash": password_hash,
                "must_change_password": must_change_password
            }
        )

        updated_user = result.fetchone()

    if updated_user is None:
        return None

    return fetch_user_by_id(user_id)

