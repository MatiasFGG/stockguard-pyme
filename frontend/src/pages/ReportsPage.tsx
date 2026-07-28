import {
  AlertTriangle,
  Banknote,
  BarChart3,
  Boxes,
  CalendarRange,
  PackageCheck,
  PackageX,
  RefreshCw,
  RotateCcw,
  ShoppingCart,
  Trophy,
  TrendingUp,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  getLowStockProducts,
  getSalesSummary,
  getTopProducts,
} from "../api/reportApi";

import type { Product } from "../types/product";

import type {
  SalesSummary,
  TopProduct,
} from "../types/report";

import { formatCurrency } from "../utils/formatCurrency";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

import "../styles/reports.css";

const emptySummary: SalesSummary = {
  total_sales_amount: 0,
  total_sales: 0,
  total_items_sold: 0,
  average_sale_amount: 0,
};

function formatLocalDate(
  date: Date,
): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentMonthRange() {
  const today = new Date();

  const firstDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    1,
  );

  return {
    dateFrom: formatLocalDate(firstDay),
    dateTo: formatLocalDate(today),
  };
}

function ReportsPage() {
  const initialRange = useMemo(
    () => getCurrentMonthRange(),
    [],
  );

  const [dateFromInput, setDateFromInput] =
    useState(initialRange.dateFrom);

  const [dateToInput, setDateToInput] =
    useState(initialRange.dateTo);

  const [appliedDateFrom, setAppliedDateFrom] =
    useState(initialRange.dateFrom);

  const [appliedDateTo, setAppliedDateTo] =
    useState(initialRange.dateTo);

  const [summary, setSummary] =
    useState<SalesSummary>(
      emptySummary,
    );

  const [topProducts, setTopProducts] =
    useState<TopProduct[]>([]);

  const [
    lowStockProducts,
    setLowStockProducts,
  ] = useState<Product[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [filterError, setFilterError] =
    useState("");

  const [reloadKey, setReloadKey] =
    useState(0);

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadReports() {
      setIsLoading(true);
      setErrorMessage("");

      const reportParams = {
        date_from:
          appliedDateFrom || undefined,

        date_to:
          appliedDateTo || undefined,
      };

      const [
        summaryResult,
        topProductsResult,
        lowStockResult,
      ] = await Promise.allSettled([
        getSalesSummary(
          reportParams,
          controller.signal,
        ),

        getTopProducts(
          {
            ...reportParams,
            limit: 10,
          },
          controller.signal,
        ),

        getLowStockProducts(
          controller.signal,
        ),
      ]);

      if (controller.signal.aborted) {
        return;
      }

      const errors: string[] = [];

      if (
        summaryResult.status ===
        "fulfilled"
      ) {
        setSummary(summaryResult.value);
      } else {
        setSummary(emptySummary);

        errors.push(
          getApiErrorMessage(
            summaryResult.reason,
            "No fue posible cargar el resumen de ventas.",
          ),
        );
      }

      if (
        topProductsResult.status ===
        "fulfilled"
      ) {
        setTopProducts(
          topProductsResult.value,
        );
      } else {
        setTopProducts([]);

        errors.push(
          getApiErrorMessage(
            topProductsResult.reason,
            "No fue posible cargar los productos más vendidos.",
          ),
        );
      }

      if (
        lowStockResult.status ===
        "fulfilled"
      ) {
        setLowStockProducts(
          lowStockResult.value,
        );
      } else {
        setLowStockProducts([]);

        errors.push(
          getApiErrorMessage(
            lowStockResult.reason,
            "No fue posible cargar las alertas de stock.",
          ),
        );
      }

      if (errors.length > 0) {
        setErrorMessage(
          errors.join(" "),
        );
      }

      setIsLoading(false);
    }

    void loadReports();

    return () => {
      controller.abort();
    };
  }, [
    appliedDateFrom,
    appliedDateTo,
    reloadKey,
  ]);

  const maximumQuantitySold =
    useMemo(() => {
      return topProducts.reduce(
        (maximum, product) =>
          Math.max(
            maximum,
            Number(
              product.total_quantity_sold,
            ),
          ),
        0,
      );
    }, [topProducts]);

  const stockSummary = useMemo(() => {
    const outOfStock =
      lowStockProducts.filter(
        (product) =>
          Number(
            product.current_stock,
          ) <= 0,
      ).length;

    const unitsNeeded =
      lowStockProducts.reduce(
        (total, product) => {
          const currentStock = Number(
            product.current_stock,
          );

          const minimumStock = Number(
            product.minimum_stock,
          );

          return (
            total +
            Math.max(
              minimumStock - currentStock,
              0,
            )
          );
        },
        0,
      );

    return {
      total: lowStockProducts.length,
      outOfStock,
      unitsNeeded,
    };
  }, [lowStockProducts]);

  const periodLabel = useMemo(() => {
    if (
      !appliedDateFrom &&
      !appliedDateTo
    ) {
      return "Todo el historial";
    }

    const formatter =
      new Intl.DateTimeFormat(
        "es-CL",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        },
      );

    function formatDate(
      value: string,
    ) {
      const [year, month, day] =
        value
          .split("-")
          .map(Number);

      const date = new Date(
        year,
        month - 1,
        day,
      );

      return formatter.format(date);
    }

    if (
      appliedDateFrom &&
      appliedDateTo
    ) {
      return `${formatDate(
        appliedDateFrom,
      )} al ${formatDate(
        appliedDateTo,
      )}`;
    }

    if (appliedDateFrom) {
      return `Desde ${formatDate(
        appliedDateFrom,
      )}`;
    }

    return `Hasta ${formatDate(
      appliedDateTo,
    )}`;
  }, [
    appliedDateFrom,
    appliedDateTo,
  ]);

  function handleApplyFilters(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFilterError("");

    if (
      dateFromInput &&
      dateToInput &&
      dateFromInput > dateToInput
    ) {
      setFilterError(
        "La fecha inicial no puede ser posterior a la fecha final.",
      );

      return;
    }

    setAppliedDateFrom(
      dateFromInput,
    );

    setAppliedDateTo(
      dateToInput,
    );
  }

  function handleCurrentMonth() {
    const range =
      getCurrentMonthRange();

    setDateFromInput(
      range.dateFrom,
    );

    setDateToInput(
      range.dateTo,
    );

    setAppliedDateFrom(
      range.dateFrom,
    );

    setAppliedDateTo(
      range.dateTo,
    );

    setFilterError("");
  }

  function handleAllHistory() {
    setDateFromInput("");
    setDateToInput("");
    setAppliedDateFrom("");
    setAppliedDateTo("");
    setFilterError("");
  }

  function handleRefresh() {
    setReloadKey(
      (currentValue) =>
        currentValue + 1,
    );
  }

  function getStockPercentage(
    product: Product,
  ) {
    const currentStock = Number(
      product.current_stock,
    );

    const minimumStock = Number(
      product.minimum_stock,
    );

    if (minimumStock <= 0) {
      return currentStock > 0
        ? 100
        : 0;
    }

    return Math.min(
      Math.max(
        (currentStock /
          minimumStock) *
          100,
        0,
      ),
      100,
    );
  }

  return (
    <section className="reports-page">
      <header className="reports-header">
        <div className="reports-header__copy">
          <div className="reports-header__icon">
            <BarChart3 size={27} />
          </div>

          <div>
            <h1>Reportes</h1>

            <p>
              Analiza las ventas, el
              rendimiento de los productos y
              las alertas de inventario.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="reports-refresh-button"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw
            size={18}
            className={
              isLoading
                ? "reports-refresh-icon reports-refresh-icon--loading"
                : "reports-refresh-icon"
            }
          />

          <span>Actualizar</span>
        </button>
      </header>

      <section className="reports-filter-panel">
        <div className="reports-filter-panel__heading">
          <div>
            <CalendarRange size={21} />

            <div>
              <strong>
                Período del reporte
              </strong>

              <span>{periodLabel}</span>
            </div>
          </div>
        </div>

        <form
          className="reports-filters"
          onSubmit={handleApplyFilters}
        >
          <label className="reports-filter">
            <span>Desde</span>

            <input
              type="date"
              value={dateFromInput}
              max={
                dateToInput ||
                undefined
              }
              onChange={(event) => {
                setDateFromInput(
                  event.target.value,
                );

                setFilterError("");
              }}
            />
          </label>

          <label className="reports-filter">
            <span>Hasta</span>

            <input
              type="date"
              value={dateToInput}
              min={
                dateFromInput ||
                undefined
              }
              onChange={(event) => {
                setDateToInput(
                  event.target.value,
                );

                setFilterError("");
              }}
            />
          </label>

          <button
            type="submit"
            className="reports-button reports-button--primary"
            disabled={isLoading}
          >
            Aplicar período
          </button>

          <button
            type="button"
            className="reports-button reports-button--secondary"
            onClick={handleCurrentMonth}
            disabled={isLoading}
          >
            <RotateCcw size={17} />
            <span>Mes actual</span>
          </button>

          <button
            type="button"
            className="reports-button reports-button--secondary"
            onClick={handleAllHistory}
            disabled={isLoading}
          >
            Todo el historial
          </button>
        </form>

        {filterError && (
          <div
            className="reports-filter-error"
            role="alert"
          >
            <AlertTriangle size={18} />
            <span>{filterError}</span>
          </div>
        )}
      </section>

      {errorMessage && (
        <div
          className="reports-warning"
          role="alert"
        >
          <AlertTriangle size={20} />

          <div>
            <strong>
              Algunos reportes no pudieron
              cargarse
            </strong>

            <span>{errorMessage}</span>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="reports-summary">
        <article className="reports-summary-card">
          <div className="reports-summary-card__header">
            <div className="reports-summary-card__icon reports-summary-card__icon--amount">
              <Banknote size={22} />
            </div>

            <span>Monto vendido</span>
          </div>

          <strong>
            {formatCurrency(
              summary.total_sales_amount,
            )}
          </strong>

          <p>
            Total generado en el período
            seleccionado.
          </p>
        </article>

        <article className="reports-summary-card">
          <div className="reports-summary-card__header">
            <div className="reports-summary-card__icon reports-summary-card__icon--sales">
              <ShoppingCart size={22} />
            </div>

            <span>Ventas</span>
          </div>

          <strong>
            {Number(
              summary.total_sales,
            )}
          </strong>

          <p>
            Operaciones registradas durante
            el período.
          </p>
        </article>

        <article className="reports-summary-card">
          <div className="reports-summary-card__header">
            <div className="reports-summary-card__icon reports-summary-card__icon--items">
              <Boxes size={22} />
            </div>

            <span>Unidades vendidas</span>
          </div>

          <strong>
            {Number(
              summary.total_items_sold,
            )}
          </strong>

          <p>
            Cantidad total de productos
            vendidos.
          </p>
        </article>

        <article className="reports-summary-card">
          <div className="reports-summary-card__header">
            <div className="reports-summary-card__icon reports-summary-card__icon--average">
              <TrendingUp size={22} />
            </div>

            <span>Venta promedio</span>
          </div>

          <strong>
            {formatCurrency(
              summary.average_sale_amount,
            )}
          </strong>

          <p>
            Valor promedio de cada operación
            registrada.
          </p>
        </article>
      </div>

      {isLoading ? (
        <div
          className="reports-loading"
          role="status"
        >
          <RefreshCw
            size={23}
            className="reports-refresh-icon reports-refresh-icon--loading"
          />

          <span>
            Generando reportes...
          </span>
        </div>
      ) : (
        <div className="reports-content-grid">
          <section className="reports-panel reports-panel--ranking">
            <header className="reports-panel__header">
              <div>
                <span className="reports-panel__eyebrow">
                  Rendimiento comercial
                </span>

                <h2>
                  Productos más vendidos
                </h2>
              </div>

              <span className="reports-panel__badge">
                Top 10
              </span>
            </header>

            {topProducts.length === 0 ? (
              <div className="reports-empty">
                <Trophy size={42} />

                <h3>
                  Sin productos vendidos
                </h3>

                <p>
                  No existen ventas dentro del
                  período seleccionado.
                </p>
              </div>
            ) : (
              <div className="reports-ranking">
                {topProducts.map(
                  (product, index) => {
                    const quantity = Number(
                      product.total_quantity_sold,
                    );

                    const progress =
                      maximumQuantitySold > 0
                        ? (quantity /
                            maximumQuantitySold) *
                          100
                        : 0;

                    return (
                      <article
                        key={product.product_id}
                        className="reports-ranking-item"
                      >
                        <div
                          className={
                            index < 3
                              ? `reports-ranking-position reports-ranking-position--${index + 1}`
                              : "reports-ranking-position"
                          }
                        >
                          {index + 1}
                        </div>

                        <div className="reports-ranking-product">
                          <div className="reports-ranking-product__header">
                            <div>
                              <strong>
                                {
                                  product.product_name
                                }
                              </strong>

                              <span>
                                Producto #
                                {
                                  product.product_id
                                }
                              </span>
                            </div>

                            <div className="reports-ranking-product__values">
                              <strong>
                                {quantity} unidades
                              </strong>

                              <span>
                                {formatCurrency(
                                  product.total_amount_sold,
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="reports-progress">
                            <div
                              className="reports-progress__value"
                              style={{
                                width: `${progress}%`,
                              }}
                            />
                          </div>
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            )}
          </section>

          <section className="reports-panel reports-panel--stock">
            <header className="reports-panel__header">
              <div>
                <span className="reports-panel__eyebrow">
                  Control de inventario
                </span>

                <h2>
                  Alertas de stock
                </h2>
              </div>

              <span className="reports-panel__badge reports-panel__badge--warning">
                {stockSummary.total} alertas
              </span>
            </header>

            <div className="reports-stock-summary">
              <article>
                <AlertTriangle size={19} />

                <div>
                  <span>Stock bajo</span>

                  <strong>
                    {stockSummary.total}
                  </strong>
                </div>
              </article>

              <article>
                <PackageX size={19} />

                <div>
                  <span>Sin stock</span>

                  <strong>
                    {stockSummary.outOfStock}
                  </strong>
                </div>
              </article>

              <article>
                <PackageCheck size={19} />

                <div>
                  <span>
                    Unidades para mínimo
                  </span>

                  <strong>
                    {stockSummary.unitsNeeded}
                  </strong>
                </div>
              </article>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="reports-empty reports-empty--healthy">
                <PackageCheck size={42} />

                <h3>
                  Inventario saludable
                </h3>

                <p>
                  Todos los productos activos
                  se encuentran sobre su stock
                  mínimo.
                </p>
              </div>
            ) : (
              <div className="reports-stock-list">
                {lowStockProducts.map(
                  (product) => {
                    const currentStock =
                      Number(
                        product.current_stock,
                      );

                    const minimumStock =
                      Number(
                        product.minimum_stock,
                      );

                    const isOutOfStock =
                      currentStock <= 0;

                    return (
                      <article
                        key={product.id}
                        className="reports-stock-item"
                      >
                        <div
                          className={
                            isOutOfStock
                              ? "reports-stock-item__icon reports-stock-item__icon--empty"
                              : "reports-stock-item__icon"
                          }
                        >
                          {isOutOfStock ? (
                            <PackageX
                              size={19}
                            />
                          ) : (
                            <AlertTriangle
                              size={19}
                            />
                          )}
                        </div>

                        <div className="reports-stock-item__content">
                          <div className="reports-stock-item__header">
                            <div>
                              <strong>
                                {product.name}
                              </strong>

                              <span>
                                {
                                  product.category_name
                                }
                              </span>
                            </div>

                            <div className="reports-stock-item__values">
                              <strong>
                                {currentStock}
                              </strong>

                              <span>
                                Mínimo:{" "}
                                {minimumStock}
                              </span>
                            </div>
                          </div>

                          <div className="reports-stock-progress">
                            <div
                              className={
                                isOutOfStock
                                  ? "reports-stock-progress__value reports-stock-progress__value--empty"
                                  : "reports-stock-progress__value"
                              }
                              style={{
                                width: `${getStockPercentage(
                                  product,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

export default ReportsPage;