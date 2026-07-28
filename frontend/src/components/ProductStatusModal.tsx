import {
  AlertTriangle,
  LoaderCircle,
  PackageCheck,
  PackageX,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
  type MouseEvent,
} from "react";

import {
  activateProduct,
  deactivateProduct,
} from "../api/productApi";

import type { Product } from "../types/product";

import { getApiErrorMessage } from "../utils/getApiErrorMessage";

import "../styles/product-status.css";

interface ProductStatusModalProps {
  product: Product | null;
  onClose: () => void;
  onStatusChanged: (
    message: string,
  ) => void;
}

function ProductStatusModal({
  product,
  onClose,
  onStatusChanged,
}: ProductStatusModalProps) {
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const isOpen = product !== null;
  const willDeactivate =
    product?.active === true;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setIsSubmitting(false);
    setErrorMessage("");
  }, [
    isOpen,
    product?.id,
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
      if (
        event.key === "Escape" &&
        !isSubmitting
      ) {
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
    isSubmitting,
    onClose,
  ]);

  if (!product) {
    return null;
  }

  const currentProduct = product;

  function handleOverlayClick(
    event: MouseEvent<HTMLDivElement>,
  ) {
    if (
      event.target === event.currentTarget &&
      !isSubmitting
    ) {
      onClose();
    }
  }

  async function handleConfirm() {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (willDeactivate) {
        await deactivateProduct(
          currentProduct.id,
        );

        onStatusChanged(
          `"${currentProduct.name}" fue desactivado correctamente.`,
        );
      } else {
        await activateProduct(
          currentProduct.id,
        );

        onStatusChanged(
          `"${currentProduct.name}" fue reactivado correctamente.`,
        );
      }

      onClose();
    } catch (error: unknown) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          willDeactivate
            ? "No fue posible desactivar el producto."
            : "No fue posible reactivar el producto.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="product-status-overlay"
      onMouseDown={handleOverlayClick}
    >
      <section
        className="product-status-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-status-title"
      >
        <header className="product-status-header">
          <div
            className={
              willDeactivate
                ? "product-status-header__icon product-status-header__icon--deactivate"
                : "product-status-header__icon product-status-header__icon--activate"
            }
          >
            {willDeactivate ? (
              <PackageX size={25} />
            ) : (
              <PackageCheck size={25} />
            )}
          </div>

          <div className="product-status-header__copy">
            <h2 id="product-status-title">
              {willDeactivate
                ? "Desactivar producto"
                : "Reactivar producto"}
            </h2>

            <p>
              {willDeactivate
                ? "El producto dejará de estar disponible para nuevas operaciones."
                : "El producto volverá a estar disponible para las operaciones del sistema."}
            </p>
          </div>

          <button
            type="button"
            className="product-status-close"
            aria-label="Cerrar confirmación"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X size={21} />
          </button>
        </header>

        <div className="product-status-body">
          <div className="product-status-product">
            <span>Producto seleccionado</span>

            <strong>
              {currentProduct.name}
            </strong>

            <small>
              Código:{" "}
              {currentProduct.barcode ||
                "Sin código de barras"}
            </small>
          </div>

          <div
            className={
              willDeactivate
                ? "product-status-notice product-status-notice--warning"
                : "product-status-notice product-status-notice--success"
            }
          >
            <AlertTriangle size={21} />

            <div>
              <strong>
                {willDeactivate
                  ? "Esta acción no elimina los datos"
                  : "El producto recuperará su estado activo"}
              </strong>

              <span>
                {willDeactivate
                  ? "El historial, stock y movimientos se conservarán. Podrás reactivarlo posteriormente."
                  : "Sus datos, precios y existencias se mantendrán tal como estaban registrados."}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div
              className="product-status-error"
              role="alert"
            >
              <AlertTriangle size={20} />

              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        <footer className="product-status-footer">
          <button
            type="button"
            className="product-status-button product-status-button--secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>

          <button
            type="button"
            className={
              willDeactivate
                ? "product-status-button product-status-button--deactivate"
                : "product-status-button product-status-button--activate"
            }
            onClick={() => {
              void handleConfirm();
            }}
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <LoaderCircle
                size={18}
                className="product-status-spinner"
              />
            )}

            <span>
              {isSubmitting
                ? "Procesando..."
                : willDeactivate
                  ? "Desactivar producto"
                  : "Reactivar producto"}
            </span>
          </button>
        </footer>
      </section>
    </div>
  );
}

export default ProductStatusModal;