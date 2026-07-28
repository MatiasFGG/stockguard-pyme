import {
  AlertTriangle,
  PackageSearch,
  Pencil,
  RefreshCw,
  Save,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";

import {
  getProductById,
  updateProduct,
} from "../api/productApi";

import type { Category } from "../types/category";
import type { Product } from "../types/product";
import type { Supplier } from "../types/supplier";

import { getApiErrorMessage } from "../utils/getApiErrorMessage";

import "../styles/product-edit.css";

interface EditProductModalProps {
  isOpen: boolean;
  productId: number | null;
  categories: Category[];
  suppliers: Supplier[];
  onClose: () => void;
  onUpdated: () => void;
}

function EditProductModal({
  isOpen,
  productId,
  categories,
  suppliers,
  onClose,
  onUpdated,
}: EditProductModalProps) {
  const [product, setProduct] =
    useState<Product | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");
  const [barcode, setBarcode] = useState("");

  const [purchasePrice, setPurchasePrice] =
    useState("");
  const [salePrice, setSalePrice] =
    useState("");

  const [minimumStock, setMinimumStock] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");
  const [supplierId, setSupplierId] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [reloadKey, setReloadKey] =
    useState(0);

  useEffect(() => {
    if (!isOpen || productId === null) {
      return;
    }

    const currentProductId = productId;
    const controller = new AbortController();

    async function loadProduct() {
      setIsLoading(true);
      setErrorMessage("");
      setProduct(null);

      try {
        const productData =
          await getProductById(
            currentProductId,
            controller.signal,
          );

        if (controller.signal.aborted) {
          return;
        }

        setProduct(productData);

        setName(productData.name);
        setDescription(
          productData.description ?? "",
        );
        setBarcode(productData.barcode ?? "");

        setPurchasePrice(
          String(productData.purchase_price),
        );

        setSalePrice(
          String(productData.sale_price),
        );

        setMinimumStock(
          String(productData.minimum_stock),
        );

        setCategoryId(
          String(productData.category_id),
        );

        setSupplierId(
          productData.supplier_id !== null
            ? String(productData.supplier_id)
            : "",
        );
      } catch (error: unknown) {
        if (controller.signal.aborted) {
          return;
        }

        setErrorMessage(
          getApiErrorMessage(
            error,
            "No fue posible cargar el producto.",
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

  if (!isOpen || productId === null) {
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

  function handleRetry() {
    setReloadKey(
      (currentValue) => currentValue + 1,
    );
  }

  function parseNonNegativeNumber(
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
const currentProductId = productId;

if (currentProductId === null) {
  setErrorMessage(
    "No se pudo identificar el producto que deseas editar.",
  );
  return;
}

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
      parseNonNegativeNumber(
        purchasePrice,
        "El precio de compra",
      );

    if (parsedPurchasePrice === null) {
      return;
    }

    const parsedSalePrice =
      parseNonNegativeNumber(
        salePrice,
        "El precio de venta",
      );

    if (parsedSalePrice === null) {
      return;
    }

    const parsedMinimumStock =
      parseNonNegativeNumber(
        minimumStock,
        "El stock mínimo",
      );

    if (parsedMinimumStock === null) {
      return;
    }

    if (!Number.isInteger(parsedMinimumStock)) {
      setErrorMessage(
        "El stock mínimo debe ser un número entero.",
      );
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await updateProduct(currentProductId, {
        name: normalizedName,

        description:
          normalizedDescription || null,

        barcode:
          normalizedBarcode || null,

        purchase_price:
          parsedPurchasePrice,

        sale_price:
          parsedSalePrice,

        minimum_stock:
          parsedMinimumStock,

        category_id:
          Number(categoryId),

        supplier_id:
          supplierId
            ? Number(supplierId)
            : null,
      });

      onUpdated();
      onClose();
    } catch (error: unknown) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "No fue posible actualizar el producto.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="product-edit-overlay"
      onMouseDown={handleOverlayClick}
    >
      <section
        className="product-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-product-title"
      >
        <header className="product-edit-header">
          <div className="product-edit-header__copy">
            <div className="product-edit-header__icon">
              <Pencil size={22} />
            </div>

            <div>
              <h2 id="edit-product-title">
                Editar producto
              </h2>

              <p>
                Actualiza la información comercial
                del producto.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="product-edit-close"
            aria-label="Cerrar formulario"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X size={22} />
          </button>
        </header>

        {isLoading && (
          <div
            className="product-edit-loading"
            role="status"
          >
            <RefreshCw
              size={23}
              className="product-edit-loading__icon"
            />

            <span>
              Cargando información del producto...
            </span>
          </div>
        )}

        {!isLoading &&
          errorMessage &&
          !product && (
            <div
              className="product-edit-load-error"
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

        {!isLoading && product && (
          <form
            className="product-edit-form"
            onSubmit={handleSubmit}
          >
            <div className="product-edit-body">
              <section className="product-edit-stock-notice">
                <PackageSearch size={21} />

                <div>
                  <strong>
                    Stock actual:{" "}
                    {product.current_stock}
                  </strong>

                  <span>
                    Las existencias se modifican
                    mediante movimientos de
                    inventario para conservar la
                    trazabilidad.
                  </span>
                </div>
              </section>

              <fieldset className="product-edit-section">
                <legend>
                  Información principal
                </legend>

                <div className="product-edit-grid">
                  <label className="product-edit-field product-edit-field--wide">
                    <span>
                      Nombre del producto
                      <strong>*</strong>
                    </span>

                    <input
                      type="text"
                      value={name}
                      onChange={(event) =>
                        setName(
                          event.target.value,
                        )
                      }
                      maxLength={150}
                      disabled={isSubmitting}
                      autoFocus
                      required
                    />
                  </label>

                  <label className="product-edit-field">
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

                  <label className="product-edit-field product-edit-field--wide">
                    <span>Descripción</span>

                    <textarea
                      value={description}
                      onChange={(event) =>
                        setDescription(
                          event.target.value,
                        )
                      }
                      rows={3}
                      placeholder="Descripción opcional"
                      disabled={isSubmitting}
                    />
                  </label>
                </div>
              </fieldset>

              <fieldset className="product-edit-section">
                <legend>
                  Clasificación
                </legend>

                <div className="product-edit-grid">
                  <label className="product-edit-field">
                    <span>
                      Categoría
                      <strong>*</strong>
                    </span>

                    <select
                      value={categoryId}
                      onChange={(event) =>
                        setCategoryId(
                          event.target.value,
                        )
                      }
                      disabled={isSubmitting}
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

                  <label className="product-edit-field">
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

              <fieldset className="product-edit-section">
                <legend>
                  Precios y alerta de stock
                </legend>

                <div className="product-edit-grid">
                  <label className="product-edit-field">
                    <span>
                      Precio de compra
                      <strong>*</strong>
                    </span>

                    <div className="product-edit-money">
                      <span>$</span>

                      <input
                        type="number"
                        value={purchasePrice}
                        onChange={(event) =>
                          setPurchasePrice(
                            event.target.value,
                          )
                        }
                        min="0"
                        step="0.01"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </label>

                  <label className="product-edit-field">
                    <span>
                      Precio de venta
                      <strong>*</strong>
                    </span>

                    <div className="product-edit-money">
                      <span>$</span>

                      <input
                        type="number"
                        value={salePrice}
                        onChange={(event) =>
                          setSalePrice(
                            event.target.value,
                          )
                        }
                        min="0"
                        step="0.01"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </label>

                  <label className="product-edit-field">
                    <span>
                      Stock mínimo
                      <strong>*</strong>
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
                      Nivel desde el cual se muestra
                      una alerta.
                    </small>
                  </label>
                </div>
              </fieldset>

              {errorMessage && (
                <div
                  className="product-edit-error"
                  role="alert"
                >
                  <AlertTriangle size={20} />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            <footer className="product-edit-footer">
              <button
                type="button"
                className="product-edit-button product-edit-button--secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="product-edit-button product-edit-button--primary"
                disabled={isSubmitting}
              >
                <Save size={18} />

                <span>
                  {isSubmitting
                    ? "Guardando cambios..."
                    : "Guardar cambios"}
                </span>
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
}

export default EditProductModal;