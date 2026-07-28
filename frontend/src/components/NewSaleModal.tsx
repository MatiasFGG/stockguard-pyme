import {
  AlertTriangle,
  Barcode,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  PackageSearch,
  Plus,
  ReceiptText,
  Save,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";

import { createSale } from "../api/saleApi";

import type { Product } from "../types/product";

import type {
  DocumentType,
  PaymentMethod,
  SaleCreateResponse,
} from "../types/sale";

import { formatCurrency } from "../utils/formatCurrency";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

import "../styles/new-sale.css";

interface NewSaleModalProps {
  isOpen: boolean;
  products: Product[];
  onClose: () => void;
  onCreated: (
    result: SaleCreateResponse,
  ) => void;
}

interface SaleCartItem {
  product: Product;
  quantity: number;
}

const paymentMethodLabels: Record<
  PaymentMethod,
  string
> = {
  EFECTIVO: "Efectivo",
  DEBITO: "Débito",
  CREDITO: "Crédito",
  TRANSFERENCIA: "Transferencia",
  OTRO: "Otro",
};

function NewSaleModal({
  isOpen,
  products,
  onClose,
  onCreated,
}: NewSaleModalProps) {
  const searchInputRef =
    useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [cart, setCart] =
    useState<SaleCartItem[]>([]);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("EFECTIVO");

  const [documentType, setDocumentType] =
    useState<"" | DocumentType>("");

  const [documentNumber, setDocumentNumber] =
    useState("");

  const [observation, setObservation] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [scannerMessage, setScannerMessage] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSearchTerm("");
    setCart([]);
    setPaymentMethod("EFECTIVO");
    setDocumentType("");
    setDocumentNumber("");
    setObservation("");
    setErrorMessage("");
    setScannerMessage("");
    setIsSubmitting(false);

    const timeoutId =
      window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
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
  }, [
    isOpen,
    isSubmitting,
    onClose,
  ]);

  useEffect(() => {
    if (!scannerMessage) {
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        setScannerMessage("");
      }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [scannerMessage]);

  const normalizedSearch =
    searchTerm.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!normalizedSearch) {
      return [];
    }

    return products
      .filter((product) => {
        const productName =
          product.name.toLowerCase();

        const barcode =
          product.barcode?.toLowerCase() ??
          "";

        return (
          productName.includes(
            normalizedSearch,
          ) ||
          barcode.includes(
            normalizedSearch,
          )
        );
      })
      .slice(0, 6);
  }, [
    normalizedSearch,
    products,
  ]);

  const cartSummary = useMemo(() => {
    return cart.reduce(
      (summary, item) => {
        const unitPrice = Number(
          item.product.sale_price,
        );

        summary.totalUnits +=
          item.quantity;

        summary.totalAmount +=
          unitPrice * item.quantity;

        return summary;
      },
      {
        totalUnits: 0,
        totalAmount: 0,
      },
    );
  }, [cart]);

  function focusScannerInput() {
    window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  }

  function addProductToCart(
    product: Product,
  ) {
    setErrorMessage("");

    if (!product.active) {
      setErrorMessage(
        `El producto "${product.name}" está inactivo.`,
      );

      focusScannerInput();
      return;
    }

    const availableStock = Number(
      product.current_stock,
    );

    if (
      !Number.isFinite(
        availableStock,
      ) ||
      availableStock <= 0
    ) {
      setErrorMessage(
        `El producto "${product.name}" no tiene stock disponible.`,
      );

      focusScannerInput();
      return;
    }

    const existingItem = cart.find(
      (item) =>
        item.product.id === product.id,
    );

    if (existingItem) {
      if (
        existingItem.quantity + 1 >
        availableStock
      ) {
        setErrorMessage(
          `No puedes agregar más unidades de "${product.name}". Stock disponible: ${availableStock}.`,
        );

        focusScannerInput();
        return;
      }

      setCart((currentCart) =>
        currentCart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item,
        ),
      );

      setScannerMessage(
        `${product.name}: cantidad aumentada.`,
      );
    } else {
      setCart((currentCart) => [
        ...currentCart,
        {
          product,
          quantity: 1,
        },
      ]);

      setScannerMessage(
        `${product.name} agregado a la venta.`,
      );
    }

    setSearchTerm("");
    focusScannerInput();
  }

  function handleProductSearch() {
    const query = searchTerm.trim();

    if (!query) {
      setErrorMessage(
        "Escribe o escanea un producto.",
      );

      focusScannerInput();
      return;
    }

    const exactBarcodeProduct =
      products.find(
        (product) =>
          product.barcode?.trim() ===
          query,
      );

    if (exactBarcodeProduct) {
      addProductToCart(
        exactBarcodeProduct,
      );

      return;
    }

    const exactNameProduct =
      products.find(
        (product) =>
          product.name
            .trim()
            .toLowerCase() ===
          query.toLowerCase(),
      );

    if (exactNameProduct) {
      addProductToCart(
        exactNameProduct,
      );

      return;
    }

    if (searchResults.length === 1) {
      addProductToCart(
        searchResults[0],
      );

      return;
    }

    if (searchResults.length > 1) {
      setErrorMessage(
        "Se encontraron varios productos. Selecciona uno de la lista.",
      );

      return;
    }

    setErrorMessage(
      `No existe un producto asociado a "${query}".`,
    );

    focusScannerInput();
  }

  function changeQuantity(
    productId: number,
    newQuantity: number,
  ) {
    setErrorMessage("");

    const cartItem = cart.find(
      (item) =>
        item.product.id === productId,
    );

    if (!cartItem) {
      return;
    }

    const availableStock = Number(
      cartItem.product.current_stock,
    );

    if (newQuantity < 1) {
      removeProduct(productId);
      return;
    }

    if (newQuantity > availableStock) {
      setErrorMessage(
        `Stock insuficiente para "${cartItem.product.name}". Disponible: ${availableStock}.`,
      );

      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: newQuantity,
            }
          : item,
      ),
    );

    focusScannerInput();
  }

  function removeProduct(
    productId: number,
  ) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          item.product.id !== productId,
      ),
    );

    setErrorMessage("");
    focusScannerInput();
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setErrorMessage("");

    if (cart.length === 0) {
      setErrorMessage(
        "Debes agregar al menos un producto.",
      );

      focusScannerInput();
      return;
    }

    const invalidItem = cart.find(
      (item) => {
        const stock = Number(
          item.product.current_stock,
        );

        return (
          item.quantity < 1 ||
          item.quantity > stock
        );
      },
    );

    if (invalidItem) {
      setErrorMessage(
        `Revisa la cantidad de "${invalidItem.product.name}".`,
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createSale({
        payment_method: paymentMethod,

        document_type:
          documentType || null,

        document_number:
          documentType &&
          documentNumber.trim()
            ? documentNumber.trim()
            : null,

        observation:
          observation.trim() || null,

        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      });

      onCreated(result);
      onClose();
    } catch (error: unknown) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "No fue posible registrar la venta.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOverlayClick(
    event: MouseEvent<HTMLDivElement>,
  ) {
    if (
      event.target ===
        event.currentTarget &&
      !isSubmitting
    ) {
      onClose();
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="new-sale-overlay"
      role="presentation"
      onMouseDown={handleOverlayClick}
    >
      <section
        className="new-sale-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-sale-title"
      >
        <header className="new-sale-header">
          <div className="new-sale-header__copy">
            <div className="new-sale-header__icon">
              <ShoppingCart size={24} />
            </div>

            <div>
              <span>
                Operación de venta
              </span>

              <h2 id="new-sale-title">
                Nueva venta
              </h2>

              <p>
                Escanea productos o
                agrégalos manualmente al
                carrito.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="new-sale-close"
            aria-label="Cerrar nueva venta"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </header>

        <form
          className="new-sale-form"
          onSubmit={handleSubmit}
        >
          <div className="new-sale-body">
            {errorMessage && (
              <div
                className="new-sale-error"
                role="alert"
              >
                <AlertTriangle
                  size={19}
                />

                <span>
                  {errorMessage}
                </span>
              </div>
            )}

            {scannerMessage && (
              <div
                className="new-sale-success"
                role="status"
              >
                <CheckCircle2
                  size={19}
                />

                <span>
                  {scannerMessage}
                </span>
              </div>
            )}

            <section className="new-sale-scanner">
              <div className="new-sale-section-title">
                <div>
                  <Barcode size={20} />

                  <span>
                    Escáner y búsqueda
                  </span>
                </div>

                <small>
                  Compatible con lector USB
                  o Bluetooth en modo
                  teclado
                </small>
              </div>

              <div className="new-sale-search-area">
                <div className="new-sale-product-search">
                  <Search size={19} />

                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(
                        event.target.value,
                      );

                      setErrorMessage("");
                    }}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter"
                      ) {
                        event.preventDefault();

                        handleProductSearch();
                      }
                    }}
                    placeholder="Escanea el código o escribe el producto..."
                    autoComplete="off"
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  type="button"
                  className="new-sale-add-button"
                  onClick={
                    handleProductSearch
                  }
                  disabled={isSubmitting}
                >
                  <Plus size={18} />

                  <span>Agregar</span>
                </button>
              </div>

              {searchResults.length >
                0 && (
                <div className="new-sale-results">
                  {searchResults.map(
                    (product) => {
                      const stock = Number(
                        product.current_stock,
                      );

                      const isUnavailable =
                        !product.active ||
                        stock <= 0;

                      return (
                        <button
                          key={product.id}
                          type="button"
                          className="new-sale-result"
                          onClick={() =>
                            addProductToCart(
                              product,
                            )
                          }
                          disabled={
                            isUnavailable ||
                            isSubmitting
                          }
                        >
                          <div className="new-sale-result__identity">
                            <PackageSearch
                              size={18}
                            />

                            <div>
                              <strong>
                                {
                                  product.name
                                }
                              </strong>

                              <span>
                                {product.barcode
                                  ? `Código: ${product.barcode}`
                                  : "Sin código de barras"}
                              </span>
                            </div>
                          </div>

                          <div className="new-sale-result__data">
                            <strong>
                              {formatCurrency(
                                product.sale_price,
                              )}
                            </strong>

                            <span>
                              Stock:{" "}
                              {
                                product.current_stock
                              }
                            </span>
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              )}
            </section>

            <section className="new-sale-cart-section">
              <div className="new-sale-section-title">
                <div>
                  <ShoppingCart
                    size={20}
                  />

                  <span>
                    Productos de la venta
                  </span>
                </div>

                <small>
                  {cartSummary.totalUnits}{" "}
                  unidades
                </small>
              </div>

              {cart.length === 0 ? (
                <div className="new-sale-empty-cart">
                  <ShoppingCart
                    size={38}
                  />

                  <strong>
                    El carrito está vacío
                  </strong>

                  <span>
                    Escanea o busca un
                    producto para comenzar.
                  </span>
                </div>
              ) : (
                <div className="new-sale-cart">
                  {cart.map((item) => {
                    const unitPrice =
                      Number(
                        item.product
                          .sale_price,
                      );

                    const subtotal =
                      unitPrice *
                      item.quantity;

                    return (
                      <article
                        key={
                          item.product.id
                        }
                        className="new-sale-cart-item"
                      >
                        <div className="new-sale-cart-item__product">
                          <strong>
                            {
                              item.product
                                .name
                            }
                          </strong>

                          <span>
                            {item.product
                              .barcode
                              ? `Código: ${item.product.barcode}`
                              : `Producto #${item.product.id}`}
                          </span>

                          <small>
                            Stock disponible:{" "}
                            {
                              item.product
                                .current_stock
                            }
                          </small>
                        </div>

                        <div className="new-sale-cart-item__price">
                          <span>
                            Precio unitario
                          </span>

                          <strong>
                            {formatCurrency(
                              unitPrice,
                            )}
                          </strong>
                        </div>

                        <div className="new-sale-quantity">
                          <button
                            type="button"
                            aria-label={`Disminuir cantidad de ${item.product.name}`}
                            onClick={() =>
                              changeQuantity(
                                item.product.id,
                                item.quantity -
                                  1,
                              )
                            }
                            disabled={
                              isSubmitting
                            }
                          >
                            <ChevronDown
                              size={17}
                            />
                          </button>

                          <input
                            type="number"
                            min="1"
                            max={Number(
                              item.product
                                .current_stock,
                            )}
                            value={
                              item.quantity
                            }
                            aria-label={`Cantidad de ${item.product.name}`}
                            onChange={(
                              event,
                            ) => {
                              const value =
                                Number(
                                  event.target
                                    .value,
                                );

                              if (
                                Number.isInteger(
                                  value,
                                )
                              ) {
                                changeQuantity(
                                  item.product
                                    .id,
                                  value,
                                );
                              }
                            }}
                            disabled={
                              isSubmitting
                            }
                          />

                          <button
                            type="button"
                            aria-label={`Aumentar cantidad de ${item.product.name}`}
                            onClick={() =>
                              changeQuantity(
                                item.product.id,
                                item.quantity +
                                  1,
                              )
                            }
                            disabled={
                              isSubmitting
                            }
                          >
                            <ChevronUp
                              size={17}
                            />
                          </button>
                        </div>

                        <div className="new-sale-cart-item__subtotal">
                          <span>
                            Subtotal
                          </span>

                          <strong>
                            {formatCurrency(
                              subtotal,
                            )}
                          </strong>
                        </div>

                        <button
                          type="button"
                          className="new-sale-remove"
                          aria-label={`Eliminar ${item.product.name}`}
                          title="Eliminar producto"
                          onClick={() =>
                            removeProduct(
                              item.product.id,
                            )
                          }
                          disabled={
                            isSubmitting
                          }
                        >
                          <Trash2 size={18} />
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="new-sale-information">
              <div className="new-sale-section-title">
                <div>
                  <ReceiptText
                    size={20}
                  />

                  <span>
                    Información de pago
                  </span>
                </div>
              </div>

              <div className="new-sale-fields-grid">
                <label className="new-sale-field">
                  <span>
                    Método de pago
                  </span>

                  <select
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(
                        event.target
                          .value as PaymentMethod,
                      )
                    }
                    disabled={isSubmitting}
                  >
                    {Object.entries(
                      paymentMethodLabels,
                    ).map(
                      ([
                        value,
                        label,
                      ]) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="new-sale-field">
                  <span>
                    Tipo de documento
                  </span>

                  <select
                    value={documentType}
                    onChange={(event) => {
                      const value =
                        event.target.value as
                          | ""
                          | DocumentType;

                      setDocumentType(
                        value,
                      );

                      if (!value) {
                        setDocumentNumber(
                          "",
                        );
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    <option value="">
                      Sin documento
                    </option>

                    <option value="BOLETA">
                      Boleta
                    </option>

                    <option value="FACTURA">
                      Factura
                    </option>
                  </select>
                </label>

                <label className="new-sale-field">
                  <span>
                    Número de documento
                  </span>

                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(event) =>
                      setDocumentNumber(
                        event.target.value,
                      )
                    }
                    placeholder="Opcional"
                    maxLength={100}
                    disabled={
                      !documentType ||
                      isSubmitting
                    }
                  />
                </label>
              </div>

              <label className="new-sale-field">
                <span>
                  Observación{" "}
                  <small>
                    (opcional)
                  </small>
                </span>

                <textarea
                  value={observation}
                  onChange={(event) =>
                    setObservation(
                      event.target.value,
                    )
                  }
                  placeholder="Información adicional de la venta..."
                  rows={3}
                  maxLength={250}
                  disabled={isSubmitting}
                />
              </label>
            </section>
          </div>

          <footer className="new-sale-footer">
            <div className="new-sale-total">
              <span>
                Total estimado
              </span>

              <strong>
                {formatCurrency(
                  cartSummary.totalAmount,
                )}
              </strong>

              <small>
                El backend verificará
                precios y stock al
                confirmar.
              </small>
            </div>

            <div className="new-sale-footer__actions">
              <button
                type="button"
                className="new-sale-button new-sale-button--secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="new-sale-button new-sale-button--primary"
                disabled={
                  isSubmitting ||
                  cart.length === 0
                }
              >
                <Save size={18} />

                <span>
                  {isSubmitting
                    ? "Registrando..."
                    : "Confirmar venta"}
                </span>
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default NewSaleModal;