from fastapi import FastAPI

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