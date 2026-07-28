import {
  AlertTriangle,
  PackagePlus,
  Save,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";

import { createProduct } from "../api/productApi";

import type { Category } from "../types/category";
import type { Supplier } from "../types/supplier";

import { getApiErrorMessage } from "../utils/getApiErrorMessage";

import "../styles/product-form.css";

interface CreateProductModalProps {
  isOpen: boolean;
  categories: Category[];
  suppliers: Supplier[];
  onClose: () => void;
  onCreated: () => void;
}

function CreateProductModal({
  isOpen,
  categories,
  suppliers,
  onClose,
  onCreated,
}: CreateProductModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");
  const [barcode, setBarcode] = useState("");

  const [purchasePrice, setPurchasePrice] =
    useState("");
  const [salePrice, setSalePrice] =
    useState("");

  const [currentStock, setCurrentStock] =
    useState("0");
  const [minimumStock, setMinimumStock] =
    useState("0");

  const [categoryId, setCategoryId] =
    useState("");
  const [supplierId, setSupplierId] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName("");
    setDescription("");
    setBarcode("");
    setPurchasePrice("");
    setSalePrice("");
    setCurrentStock("0");
    setMinimumStock("0");
    setCategoryId("");
    setSupplierId("");
    setErrorMessage("");
    setIsSubmitting(false);
  }, [isOpen]);

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

  if (!isOpen) {
    return null;
  }

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

  function validateNumber(
    value: string,
    fieldName: string,
  ): number | null {
    const numericValue = Number(value);

    if (
      !Number.isFinite(numericValue) ||
      numericValue < 0
    ) {
      setErrorMessage(
        `${fieldName} debe ser un número igual o mayor que cero.`,
      );

      return null;
    }

    return numericValue;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedName = name.trim();
    const normalizedDescription =
      description.trim();
    const normalizedBarcode = barcode.trim();

    if (!normalizedName) {
      setErrorMessage(
        "Debes ingresar el nombre del producto.",
      );
      return;
    }

    if (normalizedName.length > 150) {
      setErrorMessage(
        "El nombre no puede superar los 150 caracteres.",
      );
      return;
    }

    if (normalizedBarcode.length > 50) {
      setErrorMessage(
        "El código de barras no puede superar los 50 caracteres.",
      );
      return;
    }

    if (!categoryId) {
      setErrorMessage(
        "Debes seleccionar una categoría.",
      );
      return;
    }

    const parsedPurchasePrice =
      validateNumber(
        purchasePrice,
        "El precio de compra",
      );

    if (parsedPurchasePrice === null) {
      return;
    }

    const parsedSalePrice =
      validateNumber(
        salePrice,
        "El precio de venta",
      );

    if (parsedSalePrice === null) {
      return;
    }

    const parsedCurrentStock =
      validateNumber(
        currentStock,
        "El stock inicial",
      );

    if (parsedCurrentStock === null) {
      return;
    }

    const parsedMinimumStock =
      validateNumber(
        minimumStock,
        "El stock mínimo",
      );

    if (parsedMinimumStock === null) {
      return;
    }

    if (
      !Number.isInteger(parsedCurrentStock) ||
      !Number.isInteger(parsedMinimumStock)
    ) {
      setErrorMessage(
        "El stock inicial y el stock mínimo deben ser números enteros.",
      );
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await createProduct({
        name: normalizedName,

        description:
          normalizedDescription || null,

        barcode:
          normalizedBarcode || null,

        purchase_price:
          parsedPurchasePrice,

        sale_price:
          parsedSalePrice,

        current_stock:
          parsedCurrentStock,

        minimum_stock:
          parsedMinimumStock,

        category_id:
          Number(categoryId),

        supplier_id:
          supplierId
            ? Number(supplierId)
            : null,
      });

      onCreated();
      onClose();
    } catch (error: unknown) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "No fue posible crear el producto.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasCategories =
    categories.length > 0;

  return (
    <div
      className="product-modal-overlay"
      onMouseDown={handleOverlayClick}
    >
      <section
        className="product-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-product-title"
      >
        <header className="product-modal__header">
          <div className="product-modal__heading">
            <div className="product-modal__icon">
              <PackagePlus size={23} />
            </div>

            <div>
              <h2 id="create-product-title">
                Nuevo producto
              </h2>

              <p>
                Registra un producto en el
                catálogo de StockGuard.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="product-modal__close"
            aria-label="Cerrar formulario"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X size={22} />
          </button>
        </header>

        {!hasCategories && (
          <div
            className="product-form-warning"
            role="alert"
          >
            <AlertTriangle size={20} />

            <div>
              <strong>
                No existen categorías disponibles
              </strong>

              <span>
                Debes crear al menos una categoría
                antes de registrar productos.
              </span>
            </div>
          </div>
        )}

        <form
          className="product-form"
          onSubmit={handleSubmit}
        >
          <div className="product-form__body">
            <fieldset className="product-form__section">
              <legend>
                Información principal
              </legend>

              <div className="product-form__grid">
                <label className="product-form__field product-form__field--wide">
                  <span>
                    Nombre del producto
                    <strong aria-hidden="true">
                      *
                    </strong>
                  </span>

                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Ejemplo: Bebida cola 1,5 L"
                    maxLength={150}
                    autoFocus
                    disabled={isSubmitting}
                    required
                  />
                </label>

                <label className="product-form__field">
                  <span>
                    Código de barras
                  </span>

                  <input
                    type="text"
                    value={barcode}
                    onChange={(event) =>
                      setBarcode(
                        event.target.value,
                      )
                    }
                    placeholder="Opcional"
                    maxLength={50}
                    disabled={isSubmitting}
                  />
                </label>

                <label className="product-form__field product-form__field--wide">
                  <span>Descripción</span>

                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value,
                      )
                    }
                    placeholder="Descripción opcional del producto"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className="product-form__section">
              <legend>
                Clasificación
              </legend>

              <div className="product-form__grid">
                <label className="product-form__field">
                  <span>
                    Categoría
                    <strong aria-hidden="true">
                      *
                    </strong>
                  </span>

                  <select
                    value={categoryId}
                    onChange={(event) =>
                      setCategoryId(
                        event.target.value,
                      )
                    }
                    disabled={
                      isSubmitting ||
                      !hasCategories
                    }
                    required
                  >
                    <option value="">
                      Seleccionar categoría
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="product-form__field">
                  <span>
                    Proveedor habitual
                  </span>

                  <select
                    value={supplierId}
                    onChange={(event) =>
                      setSupplierId(
                        event.target.value,
                      )
                    }
                    disabled={isSubmitting}
                  >
                    <option value="">
                      Sin proveedor
                    </option>

                    {suppliers.map(
                      (supplier) => (
                        <option
                          key={supplier.id}
                          value={supplier.id}
                        >
                          {supplier.name}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>
            </fieldset>

            <fieldset className="product-form__section">
              <legend>
                Precios
              </legend>

              <div className="product-form__grid">
                <label className="product-form__field">
                  <span>
                    Precio de compra
                    <strong aria-hidden="true">
                      *
                    </strong>
                  </span>

                  <div className="product-form__money">
                    <span>$</span>

                    <input
                      type="number"
                      value={purchasePrice}
                      onChange={(event) =>
                        setPurchasePrice(
                          event.target.value,
                        )
                      }
                      placeholder="0"
                      min="0"
                      step="0.01"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </label>

                <label className="product-form__field">
                  <span>
                    Precio de venta
                    <strong aria-hidden="true">
                      *
                    </strong>
                  </span>

                  <div className="product-form__money">
                    <span>$</span>

                    <input
                      type="number"
                      value={salePrice}
                      onChange={(event) =>
                        setSalePrice(
                          event.target.value,
                        )
                      }
                      placeholder="0"
                      min="0"
                      step="0.01"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </label>
              </div>
            </fieldset>

            <fieldset className="product-form__section">
              <legend>
                Inventario inicial
              </legend>

              <div className="product-form__grid">
                <label className="product-form__field">
                  <span>
                    Stock inicial
                    <strong aria-hidden="true">
                      *
                    </strong>
                  </span>

                  <input
                    type="number"
                    value={currentStock}
                    onChange={(event) =>
                      setCurrentStock(
                        event.target.value,
                      )
                    }
                    min="0"
                    step="1"
                    disabled={isSubmitting}
                    required
                  />

                  <small>
                    Cantidad disponible al crear
                    el producto.
                  </small>
                </label>

                <label className="product-form__field">
                  <span>
                    Stock mínimo
                    <strong aria-hidden="true">
                      *
                    </strong>
                  </span>

                  <input
                    type="number"
                    value={minimumStock}
                    onChange={(event) =>
                      setMinimumStock(
                        event.target.value,
                      )
                    }
                    min="0"
                    step="1"
                    disabled={isSubmitting}
                    required
                  />

                  <small>
                    Nivel desde el que se mostrará
                    una alerta.
                  </small>
                </label>
              </div>
            </fieldset>

            {errorMessage && (
              <div
                className="product-form-error"
                role="alert"
              >
                <AlertTriangle size={20} />

                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          <footer className="product-modal__footer">
            <button
              type="button"
              className="product-form-button product-form-button--secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="product-form-button product-form-button--primary"
              disabled={
                isSubmitting ||
                !hasCategories
              }
            >
              <Save size={18} />

              <span>
                {isSubmitting
                  ? "Guardando..."
                  : "Guardar producto"}
              </span>
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default CreateProductModal;