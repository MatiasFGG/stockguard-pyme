from fastapi import FastAPI

from app.database import check_database_connection
from app.routers import inventory_movements, products, sales

app = FastAPI(
    title="StockGuard PyME API",
    description="API para la gestión de inventario y ventas de negocios pequeños.",
    version="0.1.0"
)

app.include_router(products.router)
app.include_router(inventory_movements.router)
app.include_router(sales.router)


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