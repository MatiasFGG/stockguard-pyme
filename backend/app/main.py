from fastapi import FastAPI, HTTPException

from app.database import check_database_connection, fetch_products

app = FastAPI(
    title="StockGuard PyME API",
    description="API para la gestión de inventario y ventas de negocios pequeños.",
    version="0.1.0"
)


@app.get("/")
def read_root():
    return {
        "message": "StockGuard PyME API funcionando correctamente"
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }


@app.get("/db-health")
def database_health_check():
    is_connected = check_database_connection()

    if is_connected:
        return {
            "database": "connected"
        }

    return {
        "database": "connection_error"
    }


@app.get("/products")
def list_products():
    try:
        products = fetch_products()
        return products
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error al obtener productos"
        )