import {
  AlertTriangle,
  Barcode,
  Boxes,
  CircleDollarSign,
  PackageSearch,
  RefreshCw,
  Tag,
  Truck,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
  type MouseEvent,
} from "react";

import { getProductById } from "../api/productApi";

import type { Product } from "../types/product";

import { formatCurrency } from "../utils/formatCurrency";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

import "../styles/product-detail.css";

interface ProductDetailModalProps {
  isOpen: boolean;
  productId: number | null;
  isAdministrator: boolean;
  onClose: () => void;
}

function ProductDetailModal({
  isOpen,
  productId,
  isAdministrator,
  onClose,
}: ProductDetailModalProps) {
  const [product, setProduct] =
    useState<Product | null>(null);

  const [isLoading, setIsLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [reloadKey, setReloadKey] =
    useState(0);

  useEffect(() => {
    if (!isOpen || productId === null) {
      return;
    }

    const controller = new AbortController();

    async function loadProduct() {
      setIsLoading(true);
      setErrorMessage("");
      setProduct(null);

      try {
        const productDetail =
          await getProductById(
            productId as number,
            controller.signal,
          );

        if (!controller.signal.aborted) {
          setProduct(productDetail);
        }
      } catch (error: unknown) {
        if (controller.signal.aborted) {
          return;
        }

        setErrorMessage(
          getApiErrorMessage(
            error,
            "No fue posible cargar el detalle del producto.",
          ),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadProduct();

    return () => {
      controller.abort();
    };
  }, [
    isOpen,
    productId,
    reloadKey,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    isOpen,
    onClose,
  ]);

  if (!isOpen || productId === null) {
    return null;
  }

  function handleOverlayClick(
    event: MouseEvent<HTMLDivElement>,
  ) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  function handleRetry() {
    setReloadKey(
      (currentValue) => currentValue + 1,
    );
  }

  function getStockStatus(
    productData: Product,
  ) {
    const currentStock = Number(
      productData.current_stock,
    );

    const minimumStock = Number(
      productData.minimum_stock,
    );

    if (currentStock <= 0) {
      return {
        label: "Sin stock",
        className:
          "product-detail-status product-detail-status--empty",
      };
    }

    if (currentStock <= minimumStock) {
      return {
        label: "Stock bajo",
        className:
          "product-detail-status product-detail-status--low",
      };
    }

    return {
      label: "Disponible",
      className:
        "product-detail-status product-detail-status--available",
    };
  }

  const stockStatus = product
    ? getStockStatus(product)
    : null;

  return (
    <div
      className="product-detail-overlay"
      onMouseDown={handleOverlayClick}
    >
      <section
        className="product-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
      >
        <header className="product-detail-header">
          <div className="product-detail-header__copy">
            <div className="product-detail-header__icon">
              <Boxes size={24} />
            </div>

            <div>
              <h2 id="product-detail-title">
                Detalle del producto
              </h2>

              <p>
                Información registrada en el
                catálogo de StockGuard.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="product-detail-close"
            aria-label="Cerrar detalle"
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </header>

        {isLoading && (
          <div
            className="product-detail-loading"
            role="status"
          >
            <RefreshCw
              size={24}
              className="product-detail-loading__icon"
            />

            <span>
              Cargando información del producto...
            </span>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div
            className="product-detail-error"
            role="alert"
          >
            <AlertTriangle size={22} />

            <div>
              <strong>
                No se pudo cargar el producto
              </strong>

              <span>{errorMessage}</span>
            </div>

            <button
              type="button"
              onClick={handleRetry}
            >
              Reintentar
            </button>
          </div>
        )}

        {!isLoading &&
          !errorMessage &&
          product && (
            <div className="product-detail-body">
              <section className="product-detail-identity">
                <div>
                  <span className="product-detail-eyebrow">
                    Producto #{product.id}
                  </span>

                  <h3>{product.name}</h3>

                  <p>
                    {product.description ||
                      "Este producto no tiene una descripción registrada."}
                  </p>
                </div>

                <span
                  className={
                    product.active
                      ? "product-detail-state product-detail-state--active"
                      : "product-detail-state product-detail-state--inactive"
                  }
                >
                  {product.active
                    ? "Producto activo"
                    : "Producto inactivo"}
                </span>
              </section>

              <div className="product-detail-grid">
                <article className="product-detail-card">
                  <div className="product-detail-card__icon">
                    <Barcode size={21} />
                  </div>

                  <div>
                    <span>Código de barras</span>

                    <strong>
                      {product.barcode ||
                        "Sin código de barras"}
                    </strong>
                  </div>
                </article>

                <article className="product-detail-card">
                  <div className="product-detail-card__icon">
                    <Tag size={21} />
                  </div>

                  <div>
                    <span>Categoría</span>

                    <strong>
                      {product.category_name}
                    </strong>
                  </div>
                </article>

                <article className="product-detail-card">
                  <div className="product-detail-card__icon">
                    <Truck size={21} />
                  </div>

                  <div>
                    <span>Proveedor</span>

                    <strong>
                      {product.supplier_name ||
                        "Sin proveedor"}
                    </strong>
                  </div>
                </article>

                <article className="product-detail-card">
                  <div className="product-detail-card__icon">
                    <PackageSearch size={21} />
                  </div>

                  <div>
                    <span>Estado del stock</span>

                    {stockStatus && (
                      <strong
                        className={
                          stockStatus.className
                        }
                      >
                        {stockStatus.label}
                      </strong>
                    )}
                  </div>
                </article>
              </div>

              <section className="product-detail-section">
                <h4>Inventario</h4>

                <div className="product-detail-values">
                  <div>
                    <span>Stock actual</span>

                    <strong>
                      {product.current_stock}
                    </strong>
                  </div>

                  <div>
                    <span>Stock mínimo</span>

                    <strong>
                      {product.minimum_stock}
                    </strong>
                  </div>
                </div>
              </section>

              <section className="product-detail-section">
                <div className="product-detail-section__title">
                  <CircleDollarSign size={20} />
                  <h4>Precios</h4>
                </div>

                <div className="product-detail-values">
                  {isAdministrator && (
                    <div>
                      <span>Precio de compra</span>

                      <strong>
                        {formatCurrency(
                          product.purchase_price,
                        )}
                      </strong>
                    </div>
                  )}

                  <div>
                    <span>Precio de venta</span>

                    <strong>
                      {formatCurrency(
                        product.sale_price,
                      )}
                    </strong>
                  </div>
                </div>
              </section>
            </div>
          )}

        <footer className="product-detail-footer">
          <button
            type="button"
            onClick={onClose}
          >
            Cerrar
          </button>
        </footer>
      </section>
    </div>
  );
}

export default ProductDetailModal;