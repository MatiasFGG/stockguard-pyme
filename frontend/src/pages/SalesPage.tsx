import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Eye,
  PackageCheck,
  Plus,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { getProducts } from "../api/productApi";
import { getSales } from "../api/saleApi";

import NewSaleModal from "../components/NewSaleModal";
import SaleDetailModal from "../components/SaleDetailModal";

import type { Product } from "../types/product";

import type {
  DocumentType,
  PaymentMethod,
  Sale,
  SaleCreateResponse,
} from "../types/sale";

import { formatCurrency } from "../utils/formatCurrency";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

import "../styles/sales.css";

type PaymentFilter =
  | "all"
  | PaymentMethod;

type DocumentFilter =
  | "all"
  | DocumentType;

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

const documentTypeLabels: Record<
  DocumentType,
  string
> = {
  BOLETA: "Boleta",
  FACTURA: "Factura",
};

function SalesPage() {
  const [sales, setSales] =
    useState<Sale[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [searchInput, setSearchInput] =
    useState("");

  const [
    submittedSearch,
    setSubmittedSearch,
  ] = useState("");

  const [
    paymentFilter,
    setPaymentFilter,
  ] = useState<PaymentFilter>("all");

  const [
    documentFilter,
    setDocumentFilter,
  ] = useState<DocumentFilter>("all");

  const [dateFrom, setDateFrom] =
    useState("");

  const [dateTo, setDateTo] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    productsError,
    setProductsError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [reloadKey, setReloadKey] =
    useState(0);

  const [
    selectedSaleId,
    setSelectedSaleId,
  ] = useState<number | null>(null);

  const [
    isCreateModalOpen,
    setIsCreateModalOpen,
  ] = useState(false);

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadSalesModule() {
      setIsLoading(true);
      setErrorMessage("");
      setProductsError("");

      const salesPromise = getSales(
        {
          payment_method:
            paymentFilter === "all"
              ? undefined
              : paymentFilter,

          document_type:
            documentFilter === "all"
              ? undefined
              : documentFilter,

          document_number:
            submittedSearch || undefined,

          date_from:
            dateFrom || undefined,

          date_to:
            dateTo || undefined,
        },
        controller.signal,
      );

      const productsPromise = getProducts(
        {
          active: true,
        },
        controller.signal,
      );

      const [
        salesResult,
        productsResult,
      ] = await Promise.allSettled([
        salesPromise,
        productsPromise,
      ]);

      if (controller.signal.aborted) {
        return;
      }

      if (
        salesResult.status ===
        "fulfilled"
      ) {
        setSales(salesResult.value);
      } else {
        setSales([]);

        setErrorMessage(
          getApiErrorMessage(
            salesResult.reason,
            "No fue posible cargar las ventas.",
          ),
        );
      }

      if (
        productsResult.status ===
        "fulfilled"
      ) {
        setProducts(
          productsResult.value,
        );
      } else {
        setProducts([]);

        setProductsError(
          getApiErrorMessage(
            productsResult.reason,
            "No fue posible cargar los productos disponibles.",
          ),
        );
      }

      setIsLoading(false);
    }

    void loadSalesModule();

    return () => {
      controller.abort();
    };
  }, [
    dateFrom,
    dateTo,
    documentFilter,
    paymentFilter,
    reloadKey,
    submittedSearch,
  ]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        setSuccessMessage("");
      }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [successMessage]);

  const summary = useMemo(() => {
    const totalAmount = sales.reduce(
      (sum, sale) =>
        sum + Number(sale.total),
      0,
    );

    const totalItems = sales.reduce(
      (sum, sale) =>
        sum +
        Number(sale.total_items),
      0,
    );

    const average =
      sales.length > 0
        ? totalAmount / sales.length
        : 0;

    return {
      totalSales: sales.length,
      totalAmount,
      totalItems,
      average,
    };
  }, [sales]);

  const availableProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.active &&
          Number(
            product.current_stock,
          ) > 0,
      ),
    [products],
  );

  function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSubmittedSearch(
      searchInput.trim(),
    );
  }

  function handleRefresh() {
    setReloadKey(
      (currentValue) =>
        currentValue + 1,
    );
  }

  function handleClearFilters() {
    setSearchInput("");
    setSubmittedSearch("");
    setPaymentFilter("all");
    setDocumentFilter("all");
    setDateFrom("");
    setDateTo("");
  }

  function handleSaleCreated(
    result: SaleCreateResponse,
  ) {
    setSuccessMessage(
      `Venta #${result.sale.id} registrada correctamente por ${formatCurrency(
        result.sale.total,
      )}.`,
    );

    setSearchInput("");
    setSubmittedSearch("");
    setPaymentFilter("all");
    setDocumentFilter("all");
    setDateFrom("");
    setDateTo("");

    setReloadKey(
      (currentValue) =>
        currentValue + 1,
    );
  }

  function formatSaleDate(
    value: string,
  ) {
    const date = new Date(value);

    if (
      Number.isNaN(date.getTime())
    ) {
      return value;
    }

    return new Intl.DateTimeFormat(
      "es-CL",
      {
        dateStyle: "short",
        timeStyle: "short",
      },
    ).format(date);
  }

  const hasActiveFilters =
    submittedSearch !== "" ||
    paymentFilter !== "all" ||
    documentFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";

  return (
    <>
      <section className="sales-page">
        <header className="sales-header">
          <div className="sales-header__copy">
            <div className="sales-header__icon">
              <ShoppingCart size={27} />
            </div>

            <div>
              <h1>Ventas</h1>

              <p>
                Registra operaciones y
                consulta el historial de
                ventas del negocio.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="sales-header__action"
            onClick={() =>
              setIsCreateModalOpen(true)
            }
            disabled={
              availableProducts.length ===
              0
            }
            title={
              availableProducts.length ===
              0
                ? "No existen productos activos con stock"
                : "Registrar nueva venta"
            }
          >
            <Plus size={19} />

            <span>Nueva venta</span>
          </button>
        </header>

        {successMessage && (
          <div
            className="sales-success"
            role="status"
          >
            <CheckCircle2 size={20} />

            <span>
              {successMessage}
            </span>
          </div>
        )}

        {productsError && (
          <div
            className="sales-warning"
            role="alert"
          >
            <AlertTriangle size={19} />

            <span>
              {productsError}
            </span>
          </div>
        )}

        <div className="sales-summary">
          <article className="sales-summary-card">
            <div className="sales-summary-card__icon">
              <ReceiptText size={21} />
            </div>

            <div>
              <span>
                Ventas mostradas
              </span>

              <strong>
                {summary.totalSales}
              </strong>
            </div>
          </article>

          <article className="sales-summary-card">
            <div className="sales-summary-card__icon sales-summary-card__icon--amount">
              <Banknote size={21} />
            </div>

            <div>
              <span>Monto vendido</span>

              <strong>
                {formatCurrency(
                  summary.totalAmount,
                )}
              </strong>
            </div>
          </article>

          <article className="sales-summary-card">
            <div className="sales-summary-card__icon sales-summary-card__icon--items">
              <PackageCheck size={21} />
            </div>

            <div>
              <span>
                Unidades vendidas
              </span>

              <strong>
                {summary.totalItems}
              </strong>
            </div>
          </article>

          <article className="sales-summary-card">
            <div className="sales-summary-card__icon sales-summary-card__icon--average">
              <TrendingUp size={21} />
            </div>

            <div>
              <span>Venta promedio</span>

              <strong>
                {formatCurrency(
                  summary.average,
                )}
              </strong>
            </div>
          </article>
        </div>

        <section className="sales-panel">
          <div className="sales-toolbar">
            <form
              className="sales-search"
              onSubmit={handleSearch}
            >
              <div className="sales-search__field">
                <Search
                  size={19}
                  aria-hidden="true"
                />

                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(
                      event.target.value,
                    )
                  }
                  placeholder="Buscar número de documento..."
                  aria-label="Buscar número de documento"
                />
              </div>

              <button
                type="submit"
                className="sales-button sales-button--primary"
              >
                Buscar
              </button>
            </form>

            <div className="sales-toolbar__actions">
              <label
                className="sales-filter"
                htmlFor="sales-payment-filter"
              >
                <span>
                  Método de pago
                </span>

                <select
                  id="sales-payment-filter"
                  value={paymentFilter}
                  onChange={(event) =>
                    setPaymentFilter(
                      event.target
                        .value as PaymentFilter,
                    )
                  }
                >
                  <option value="all">
                    Todos
                  </option>

                  <option value="EFECTIVO">
                    Efectivo
                  </option>

                  <option value="DEBITO">
                    Débito
                  </option>

                  <option value="CREDITO">
                    Crédito
                  </option>

                  <option value="TRANSFERENCIA">
                    Transferencia
                  </option>

                  <option value="OTRO">
                    Otro
                  </option>
                </select>
              </label>

              <label
                className="sales-filter"
                htmlFor="sales-document-filter"
              >
                <span>Documento</span>

                <select
                  id="sales-document-filter"
                  value={documentFilter}
                  onChange={(event) =>
                    setDocumentFilter(
                      event.target
                        .value as DocumentFilter,
                    )
                  }
                >
                  <option value="all">
                    Todos
                  </option>

                  <option value="BOLETA">
                    Boleta
                  </option>

                  <option value="FACTURA">
                    Factura
                  </option>
                </select>
              </label>

              <label
                className="sales-filter"
                htmlFor="sales-date-from"
              >
                <span>Desde</span>

                <input
                  id="sales-date-from"
                  type="date"
                  value={dateFrom}
                  max={
                    dateTo || undefined
                  }
                  onChange={(event) =>
                    setDateFrom(
                      event.target.value,
                    )
                  }
                />
              </label>

              <label
                className="sales-filter"
                htmlFor="sales-date-to"
              >
                <span>Hasta</span>

                <input
                  id="sales-date-to"
                  type="date"
                  value={dateTo}
                  min={
                    dateFrom || undefined
                  }
                  onChange={(event) =>
                    setDateTo(
                      event.target.value,
                    )
                  }
                />
              </label>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="sales-button sales-button--secondary"
                  onClick={
                    handleClearFilters
                  }
                >
                  <RotateCcw size={17} />

                  <span>Limpiar</span>
                </button>
              )}

              <button
                type="button"
                className="sales-button sales-button--secondary"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  size={18}
                  className={
                    isLoading
                      ? "sales-refresh sales-refresh--loading"
                      : "sales-refresh"
                  }
                />

                <span>Actualizar</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div
              className="sales-message sales-message--error"
              role="alert"
            >
              <AlertTriangle size={20} />

              <div>
                <strong>
                  No se pudieron cargar
                  las ventas
                </strong>

                <span>
                  {errorMessage}
                </span>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
              >
                Reintentar
              </button>
            </div>
          )}

          {!errorMessage &&
            isLoading && (
              <div
                className="sales-message"
                role="status"
              >
                <RefreshCw
                  size={21}
                  className="sales-refresh sales-refresh--loading"
                />

                <span>
                  Cargando ventas...
                </span>
              </div>
            )}

          {!errorMessage &&
            !isLoading &&
            sales.length === 0 && (
              <div className="sales-empty">
                <ReceiptText size={43} />

                <h2>
                  No se encontraron
                  ventas
                </h2>

                <p>
                  Todavía no existen ventas
                  o los filtros no
                  encontraron resultados.
                </p>
              </div>
            )}

          {!errorMessage &&
            !isLoading &&
            sales.length > 0 && (
              <div className="sales-table-wrapper">
                <table className="sales-table">
                  <thead>
                    <tr>
                      <th>Venta</th>
                      <th>Fecha</th>
                      <th>Documento</th>
                      <th>
                        Método de pago
                      </th>
                      <th>Productos</th>
                      <th>
                        Registrada por
                      </th>
                      <th>Total</th>

                      <th className="sales-table__actions">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {sales.map(
                      (sale) => (
                        <tr key={sale.id}>
                          <td>
                            <div className="sale-identity">
                              <strong>
                                Venta #
                                {sale.id}
                              </strong>

                              <span>
                                Registro de
                                venta
                              </span>
                            </div>
                          </td>

                          <td className="sale-date">
                            {formatSaleDate(
                              sale.sale_date,
                            )}
                          </td>

                          <td>
                            {sale.document_type ? (
                              <div className="sale-document">
                                <strong>
                                  {
                                    documentTypeLabels[
                                      sale
                                        .document_type
                                    ]
                                  }
                                </strong>

                                <span>
                                  {sale.document_number ??
                                    "Sin número"}
                                </span>
                              </div>
                            ) : (
                              <span className="sale-empty-value">
                                Sin documento
                              </span>
                            )}
                          </td>

                          <td>
                            <span
                              className={`sale-payment sale-payment--${sale.payment_method.toLowerCase()}`}
                            >
                              {
                                paymentMethodLabels[
                                  sale
                                    .payment_method
                                ]
                              }
                            </span>
                          </td>

                          <td>
                            <div className="sale-products-count">
                              <strong>
                                {
                                  sale.total_items
                                }{" "}
                                unidades
                              </strong>

                              <span>
                                {
                                  sale.total_products
                                }{" "}
                                productos
                                distintos
                              </span>
                            </div>
                          </td>

                          <td>
                            <div className="sale-user">
                              <strong>
                                {sale.created_by_full_name ??
                                  sale.created_by_username ??
                                  "No disponible"}
                              </strong>

                              {sale.created_by_full_name &&
                                sale.created_by_username && (
                                  <span>
                                    @
                                    {
                                      sale.created_by_username
                                    }
                                  </span>
                                )}
                            </div>
                          </td>

                          <td className="sale-total">
                            {formatCurrency(
                              sale.total,
                            )}
                          </td>

                          <td className="sales-table__actions">
                            <button
                              type="button"
                              className="sale-row-action"
                              title="Ver detalle"
                              aria-label={`Ver detalle de la venta ${sale.id}`}
                              onClick={() =>
                                setSelectedSaleId(
                                  sale.id,
                                )
                              }
                            >
                              <Eye
                                size={18}
                              />
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      </section>

      <SaleDetailModal
        isOpen={
          selectedSaleId !== null
        }
        saleId={selectedSaleId}
        onClose={() =>
          setSelectedSaleId(null)
        }
      />

      <NewSaleModal
        isOpen={isCreateModalOpen}
        products={availableProducts}
        onClose={() =>
          setIsCreateModalOpen(false)
        }
        onCreated={
          handleSaleCreated
        }
      />
    </>
  );
}

export default SalesPage;