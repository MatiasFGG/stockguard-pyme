import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  PackageMinus,
  Save,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { adjustProductStock } from "../api/inventoryApi";

import type {
  ManualAdjustmentType,
  StockAdjustmentResponse,
} from "../types/inventory";

import type { Product } from "../types/product";

import { getApiErrorMessage } from "../utils/getApiErrorMessage";

interface StockAdjustmentModalProps {
  isOpen: boolean;
  products: Product[];
  onClose: () => void;
  onAdjusted: (
    result: StockAdjustmentResponse,
  ) => void;
}

function StockAdjustmentModal({
  isOpen,
  products,
  onClose,
  onAdjusted,
}: StockAdjustmentModalProps) {
  const [productId, setProductId] =
    useState("");

  const [movementType, setMovementType] =
    useState<ManualAdjustmentType>(
      "AJUSTE_POSITIVO",
    );

  const [quantity, setQuantity] =
    useState("");

  const [reason, setReason] =
    useState("");

  const [reference, setReference] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setProductId("");
    setMovementType("AJUSTE_POSITIVO");
    setQuantity("");
    setReason("");
    setReference("");
    setErrorMessage("");
    setIsSubmitting(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

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
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isOpen, isSubmitting, onClose]);

  const selectedProduct = useMemo(
    () =>
      products.find(
        (product) =>
          product.id === Number(productId),
      ) ?? null,
    [productId, products],
  );

  const numericQuantity = Number(quantity);

  const projectedStock = useMemo(() => {
    if (
      !selectedProduct ||
      !Number.isFinite(numericQuantity) ||
      numericQuantity <= 0
    ) {
      return null;
    }

    const currentStock = Number(
      selectedProduct.current_stock,
    );

    if (
      movementType === "AJUSTE_POSITIVO"
    ) {
      return currentStock + numericQuantity;
    }

    return currentStock - numericQuantity;
  }, [
    movementType,
    numericQuantity,
    selectedProduct,
  ]);

  const hasInvalidProjectedStock =
    projectedStock !== null &&
    projectedStock < 0;

  function handleOverlayClick(
    event: React.MouseEvent<HTMLDivElement>,
  ) {
    if (
      event.target === event.currentTarget &&
      !isSubmitting
    ) {
      onClose();
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setErrorMessage("");

    if (!selectedProduct) {
      setErrorMessage(
        "Debes seleccionar un producto.",
      );

      return;
    }

    if (
      !Number.isFinite(numericQuantity) ||
      numericQuantity <= 0
    ) {
      setErrorMessage(
        "La cantidad debe ser mayor que cero.",
      );

      return;
    }

    if (hasInvalidProjectedStock) {
      setErrorMessage(
        "El ajuste dejaría el producto con stock negativo.",
      );

      return;
    }

    if (reason.trim().length < 3) {
      setErrorMessage(
        "Debes indicar un motivo de al menos 3 caracteres.",
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const result = await adjustProductStock({
        product_id: selectedProduct.id,
        movement_type: movementType,
        quantity: numericQuantity,
        reason: reason.trim(),
        reference:
          reference.trim() || null,
      });

      onAdjusted(result);
      onClose();
    } catch (error: unknown) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "No fue posible registrar el ajuste de stock.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="inventory-modal-overlay"
      role="presentation"
      onMouseDown={handleOverlayClick}
    >
      <section
        className="inventory-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-adjustment-title"
      >
        <header className="inventory-modal__header">
          <div>
            <span className="inventory-modal__eyebrow">
              Gestión de existencias
            </span>

            <h2 id="stock-adjustment-title">
              Ajuste manual de stock
            </h2>

            <p>
              Registra una corrección, pérdida o
              entrada adicional de existencias.
            </p>
          </div>

          <button
            type="button"
            className="inventory-modal__close"
            aria-label="Cerrar"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </header>

        <form
          className="inventory-adjustment-form"
          onSubmit={handleSubmit}
        >
          {errorMessage && (
            <div
              className="inventory-form-error"
              role="alert"
            >
              <AlertTriangle size={19} />
              <span>{errorMessage}</span>
            </div>
          )}

          <label className="inventory-form-field">
            <span>Producto</span>

            <select
              value={productId}
              onChange={(event) =>
                setProductId(
                  event.target.value,
                )
              }
              disabled={isSubmitting}
            >
              <option value="">
                Selecciona un producto
              </option>

              {products.map((product) => (
                <option
                  key={product.id}
                  value={product.id}
                >
                  {product.name} — Stock:{" "}
                  {product.current_stock}
                </option>
              ))}
            </select>
          </label>

          {selectedProduct && (
            <div className="inventory-stock-preview">
              <div>
                <span>Producto</span>
                <strong>
                  {selectedProduct.name}
                </strong>
              </div>

              <div>
                <span>Stock actual</span>
                <strong>
                  {selectedProduct.current_stock}
                </strong>
              </div>

              <div>
                <span>Stock proyectado</span>

                <strong
                  className={
                    hasInvalidProjectedStock
                      ? "inventory-stock-preview__invalid"
                      : ""
                  }
                >
                  {projectedStock ?? "—"}
                </strong>
              </div>
            </div>
          )}

          <fieldset className="inventory-adjustment-types">
            <legend>Tipo de ajuste</legend>

            <label
              className={
                movementType ===
                "AJUSTE_POSITIVO"
                  ? "inventory-adjustment-option inventory-adjustment-option--selected"
                  : "inventory-adjustment-option"
              }
            >
              <input
                type="radio"
                name="movementType"
                value="AJUSTE_POSITIVO"
                checked={
                  movementType ===
                  "AJUSTE_POSITIVO"
                }
                onChange={() =>
                  setMovementType(
                    "AJUSTE_POSITIVO",
                  )
                }
                disabled={isSubmitting}
              />

              <ArrowUp size={20} />

              <span>
                <strong>Ajuste positivo</strong>
                <small>
                  Añade unidades al inventario
                </small>
              </span>
            </label>

            <label
              className={
                movementType ===
                "AJUSTE_NEGATIVO"
                  ? "inventory-adjustment-option inventory-adjustment-option--selected"
                  : "inventory-adjustment-option"
              }
            >
              <input
                type="radio"
                name="movementType"
                value="AJUSTE_NEGATIVO"
                checked={
                  movementType ===
                  "AJUSTE_NEGATIVO"
                }
                onChange={() =>
                  setMovementType(
                    "AJUSTE_NEGATIVO",
                  )
                }
                disabled={isSubmitting}
              />

              <ArrowDown size={20} />

              <span>
                <strong>Ajuste negativo</strong>
                <small>
                  Descuenta unidades por
                  corrección
                </small>
              </span>
            </label>

            <label
              className={
                movementType === "MERMA"
                  ? "inventory-adjustment-option inventory-adjustment-option--selected inventory-adjustment-option--loss"
                  : "inventory-adjustment-option inventory-adjustment-option--loss"
              }
            >
              <input
                type="radio"
                name="movementType"
                value="MERMA"
                checked={
                  movementType === "MERMA"
                }
                onChange={() =>
                  setMovementType("MERMA")
                }
                disabled={isSubmitting}
              />

              <PackageMinus size={20} />

              <span>
                <strong>Merma</strong>
                <small>
                  Registra pérdidas o productos
                  dañados
                </small>
              </span>
            </label>
          </fieldset>

          <div className="inventory-form-grid">
            <label className="inventory-form-field">
              <span>Cantidad</span>

              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    event.target.value,
                  )
                }
                placeholder="Ejemplo: 5"
                disabled={isSubmitting}
              />
            </label>

            <label className="inventory-form-field">
              <span>
                Referencia{" "}
                <small>(opcional)</small>
              </span>

              <input
                type="text"
                value={reference}
                onChange={(event) =>
                  setReference(
                    event.target.value,
                  )
                }
                placeholder="Ejemplo: AJUSTE-001"
                maxLength={100}
                disabled={isSubmitting}
              />
            </label>
          </div>

          <label className="inventory-form-field">
            <span>Motivo</span>

            <textarea
              value={reason}
              onChange={(event) =>
                setReason(event.target.value)
              }
              placeholder="Describe por qué se realiza este ajuste..."
              rows={3}
              maxLength={250}
              disabled={isSubmitting}
            />
          </label>

          <footer className="inventory-modal__footer">
            <button
              type="button"
              className="inventory-modal-button inventory-modal-button--secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="inventory-modal-button inventory-modal-button--primary"
              disabled={
                isSubmitting ||
                hasInvalidProjectedStock
              }
            >
              <Save size={18} />

              <span>
                {isSubmitting
                  ? "Registrando..."
                  : "Registrar ajuste"}
              </span>
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default StockAdjustmentModal;