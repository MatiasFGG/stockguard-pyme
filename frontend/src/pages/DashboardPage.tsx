import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Banknote,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  PackageCheck,
  PackageMinus,
  PackageX,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";



import { getInventoryMovements } from "../api/inventoryApi";
import { getProducts } from "../api/productApi";
import { getSales } from "../api/saleApi";

import { useAuth } from "../contexts/AuthContext";

import type {
  InventoryMovement,
  InventoryMovementType,
} from "../types/inventory";

import type { Product } from "../types/product";

import type {
  PaymentMethod,
  Sale,
} from "../types/sale";

import { formatCurrency } from "../utils/formatCurrency";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

import "../styles/dashboard.css";

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

const movementLabels: Record<
  InventoryMovementType,
  string
> = {
  ENTRADA: "Entrada",
  VENTA: "Venta",
  AJUSTE_POSITIVO: "Ajuste positivo",
  AJUSTE_NEGATIVO: "Ajuste negativo",
  MERMA: "Merma",
};

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    today.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

interface DashboardLinkProps {
  to: string;
  className?: string;
  children: ReactNode;
}

function Link({
  to,
  className,
  children,
}: DashboardLinkProps) {
  return (
    <a
      href={to}
      className={className}
    >
      {children}
    </a>
  );
}

function DashboardPage() {
  const { user } = useAuth();

  const [products, setProducts] =
    useState<Product[]>([]);

  const [todaySales, setTodaySales] =
    useState<Sale[]>([]);

  const [recentSales, setRecentSales] =
    useState<Sale[]>([]);

  const [movements, setMovements] =
    useState<InventoryMovement[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [reloadKey, setReloadKey] =
    useState(0);

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadDashboard() {
      setIsLoading(true);
      setErrorMessage("");

      const today = getTodayDate();

      const [
        productsResult,
        todaySalesResult,
        recentSalesResult,
        movementsResult,
      ] = await Promise.allSettled([
        getProducts(
          {
            active: true,
          },
          controller.signal,
        ),

        getSales(
          {
            date_from: today,
            date_to: today,
          },
          controller.signal,
        ),

        getSales(
          {},
          controller.signal,
        ),

        getInventoryMovements(
          controller.signal,
        ),
      ]);

      if (controller.signal.aborted) {
        return;
      }

      const errors: string[] = [];

      if (
        productsResult.status ===
        "fulfilled"
      ) {
        setProducts(
          productsResult.value,
        );
      } else {
        setProducts([]);

        errors.push(
          getApiErrorMessage(
            productsResult.reason,
            "No fue posible cargar los productos.",
          ),
        );
      }

      if (
        todaySalesResult.status ===
        "fulfilled"
      ) {
        setTodaySales(
          todaySalesResult.value,
        );
      } else {
        setTodaySales([]);

        errors.push(
          getApiErrorMessage(
            todaySalesResult.reason,
            "No fue posible cargar las ventas del día.",
          ),
        );
      }

      if (
        recentSalesResult.status ===
        "fulfilled"
      ) {
        setRecentSales(
          recentSalesResult.value,
        );
      } else {
        setRecentSales([]);

        errors.push(
          getApiErrorMessage(
            recentSalesResult.reason,
            "No fue posible cargar las ventas recientes.",
          ),
        );
      }

      if (
        movementsResult.status ===
        "fulfilled"
      ) {
        setMovements(
          movementsResult.value,
        );
      } else {
        setMovements([]);

        errors.push(
          getApiErrorMessage(
            movementsResult.reason,
            "No fue posible cargar los movimientos recientes.",
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

    void loadDashboard();

    return () => {
      controller.abort();
    };
  }, [reloadKey]);

  const summary = useMemo(() => {
    const salesAmount = todaySales.reduce(
      (total, sale) =>
        total + Number(sale.total),
      0,
    );

    const itemsSold = todaySales.reduce(
      (total, sale) =>
        total +
        Number(sale.total_items),
      0,
    );

    const totalStock = products.reduce(
      (total, product) =>
        total +
        Number(product.current_stock),
      0,
    );

    const lowStockProducts =
      products.filter(
        (product) =>
          Number(
            product.current_stock,
          ) <=
          Number(
            product.minimum_stock,
          ),
      );

    const outOfStockProducts =
      products.filter(
        (product) =>
          Number(
            product.current_stock,
          ) <= 0,
      );

    return {
      salesAmount,
      salesCount: todaySales.length,
      itemsSold,
      activeProducts: products.length,
      totalStock,
      lowStockCount:
        lowStockProducts.length,
      outOfStockCount:
        outOfStockProducts.length,
    };
  }, [products, todaySales]);

  const displayedSales = useMemo(
    () => recentSales.slice(0, 5),
    [recentSales],
  );

  const displayedMovements = useMemo(
    () => movements.slice(0, 6),
    [movements],
  );

  const displayedLowStockProducts =
    useMemo(
      () =>
        [...products]
          .filter(
            (product) =>
              Number(
                product.current_stock,
              ) <=
              Number(
                product.minimum_stock,
              ),
          )
          .sort(
            (firstProduct, secondProduct) =>
              Number(
                firstProduct.current_stock,
              ) -
              Number(
                secondProduct.current_stock,
              ),
          )
          .slice(0, 5),
      [products],
    );

  const currentDateLabel =
    useMemo(() => {
      const label =
        new Intl.DateTimeFormat(
          "es-CL",
          {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          },
        ).format(new Date());

      return (
        label.charAt(0).toUpperCase() +
        label.slice(1)
      );
    }, []);

  const userName =
    user?.full_name ??
    user?.username ??
    "usuario";

  function handleRefresh() {
    setReloadKey(
      (currentValue) =>
        currentValue + 1,
    );
  }

  function formatDateTime(
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

  function getMovementSign(
    movementType: InventoryMovementType,
  ) {
    if (
      movementType === "ENTRADA" ||
      movementType ===
        "AJUSTE_POSITIVO"
    ) {
      return "+";
    }

    return "-";
  }

  function getMovementIcon(
    movementType: InventoryMovementType,
  ) {
    if (
      movementType === "ENTRADA" ||
      movementType ===
        "AJUSTE_POSITIVO"
    ) {
      return <ArrowUp size={17} />;
    }

    if (
      movementType === "MERMA"
    ) {
      return <PackageMinus size={17} />;
    }

    return <ArrowDown size={17} />;
  }

  return (
    <section className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header__copy">
          <div className="dashboard-header__icon">
            <LayoutDashboard size={27} />
          </div>

          <div>
            <span className="dashboard-header__eyebrow">
              {currentDateLabel}
            </span>

            <h1>
              Hola, {userName}
            </h1>

            <p>
              Este es el resumen actual de
              StockGuard PyME.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="dashboard-refresh-button"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw
            size={18}
            className={
              isLoading
                ? "dashboard-refresh-icon dashboard-refresh-icon--loading"
                : "dashboard-refresh-icon"
            }
          />

          <span>Actualizar</span>
        </button>
      </header>

      {errorMessage && (
        <div
          className="dashboard-warning"
          role="alert"
        >
          <AlertTriangle size={20} />

          <div>
            <strong>
              Algunos datos no pudieron
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

      <div className="dashboard-summary">
        <article className="dashboard-summary-card">
          <div className="dashboard-summary-card__header">
            <div className="dashboard-summary-card__icon dashboard-summary-card__icon--sales">
              <Banknote size={22} />
            </div>

            <span>Hoy</span>
          </div>

          <strong>
            {formatCurrency(
              summary.salesAmount,
            )}
          </strong>

          <p>
            {summary.salesCount}{" "}
            {summary.salesCount === 1
              ? "venta registrada"
              : "ventas registradas"}
          </p>
        </article>

        <article className="dashboard-summary-card">
          <div className="dashboard-summary-card__header">
            <div className="dashboard-summary-card__icon dashboard-summary-card__icon--items">
              <ShoppingCart size={22} />
            </div>

            <span>Ventas</span>
          </div>

          <strong>
            {summary.itemsSold}
          </strong>

          <p>
            Unidades vendidas durante el
            día
          </p>
        </article>

        <article className="dashboard-summary-card">
          <div className="dashboard-summary-card__header">
            <div className="dashboard-summary-card__icon dashboard-summary-card__icon--stock">
              <Boxes size={22} />
            </div>

            <span>Inventario</span>
          </div>

          <strong>
            {summary.totalStock}
          </strong>

          <p>
            Unidades disponibles en{" "}
            {summary.activeProducts} productos
          </p>
        </article>

        <article className="dashboard-summary-card">
          <div className="dashboard-summary-card__header">
            <div className="dashboard-summary-card__icon dashboard-summary-card__icon--warning">
              <AlertTriangle size={22} />
            </div>

            <span>Alertas</span>
          </div>

          <strong>
            {summary.lowStockCount}
          </strong>

          <p>
            Productos con stock bajo,{" "}
            {summary.outOfStockCount} sin
            existencias
          </p>
        </article>
      </div>

      {isLoading ? (
        <div
          className="dashboard-loading"
          role="status"
        >
          <RefreshCw
            size={23}
            className="dashboard-refresh-icon dashboard-refresh-icon--loading"
          />

          <span>
            Actualizando el panel...
          </span>
        </div>
      ) : (
        <>
          <div className="dashboard-main-grid">
            <section className="dashboard-panel dashboard-panel--sales">
              <header className="dashboard-panel__header">
                <div>
                  <span className="dashboard-panel__eyebrow">
                    Actividad comercial
                  </span>

                  <h2>Ventas recientes</h2>
                </div>

                <Link
                  to="/ventas"
                  className="dashboard-panel__link"
                >
                  <span>Ver ventas</span>
                  <ArrowRight size={17} />
                </Link>
              </header>

              {displayedSales.length === 0 ? (
                <div className="dashboard-empty">
                  <ShoppingCart size={37} />

                  <strong>
                    Todavía no hay ventas
                  </strong>

                  <span>
                    Las operaciones aparecerán
                    aquí cuando sean registradas.
                  </span>
                </div>
              ) : (
                <div className="dashboard-sales-list">
                  {displayedSales.map(
                    (sale) => (
                      <article
                        key={sale.id}
                        className="dashboard-sale"
                      >
                        <div className="dashboard-sale__icon">
                          <ShoppingCart
                            size={19}
                          />
                        </div>

                        <div className="dashboard-sale__identity">
                          <strong>
                            Venta #{sale.id}
                          </strong>

                          <span>
                            {formatDateTime(
                              sale.sale_date,
                            )}
                          </span>
                        </div>

                        <div className="dashboard-sale__method">
                          <span>
                            {
                              paymentMethodLabels[
                                sale
                                  .payment_method
                              ]
                            }
                          </span>

                          <small>
                            {sale.total_items}{" "}
                            unidades
                          </small>
                        </div>

                        <strong className="dashboard-sale__total">
                          {formatCurrency(
                            sale.total,
                          )}
                        </strong>
                      </article>
                    ),
                  )}
                </div>
              )}
            </section>

            <section className="dashboard-panel">
              <header className="dashboard-panel__header">
                <div>
                  <span className="dashboard-panel__eyebrow">
                    Control de existencias
                  </span>

                  <h2>Alertas de stock</h2>
                </div>

                <Link
                  to="/productos"
                  className="dashboard-panel__link"
                >
                  <span>Ver productos</span>
                  <ArrowRight size={17} />
                </Link>
              </header>

              {displayedLowStockProducts.length ===
              0 ? (
                <div className="dashboard-empty dashboard-empty--success">
                  <PackageCheck size={37} />

                  <strong>
                    Inventario saludable
                  </strong>

                  <span>
                    No existen productos con
                    stock bajo actualmente.
                  </span>
                </div>
              ) : (
                <div className="dashboard-stock-list">
                  {displayedLowStockProducts.map(
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
                          className="dashboard-stock-item"
                        >
                          <div
                            className={
                              isOutOfStock
                                ? "dashboard-stock-item__icon dashboard-stock-item__icon--empty"
                                : "dashboard-stock-item__icon"
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

                          <div className="dashboard-stock-item__identity">
                            <strong>
                              {product.name}
                            </strong>

                            <span>
                              {
                                product.category_name
                              }
                            </span>
                          </div>

                          <div className="dashboard-stock-item__amount">
                            <strong>
                              {currentStock}
                            </strong>

                            <span>
                              Mínimo:{" "}
                              {minimumStock}
                            </span>
                          </div>
                        </article>
                      );
                    },
                  )}
                </div>
              )}
            </section>
          </div>

          <div className="dashboard-secondary-grid">
            <section className="dashboard-panel">
              <header className="dashboard-panel__header">
                <div>
                  <span className="dashboard-panel__eyebrow">
                    Trazabilidad
                  </span>

                  <h2>
                    Movimientos recientes
                  </h2>
                </div>

                <Link
                  to="/inventario"
                  className="dashboard-panel__link"
                >
                  <span>Ver inventario</span>
                  <ArrowRight size={17} />
                </Link>
              </header>

              {displayedMovements.length ===
              0 ? (
                <div className="dashboard-empty">
                  <ClipboardList
                    size={37}
                  />

                  <strong>
                    Sin movimientos
                  </strong>

                  <span>
                    Los cambios de stock
                    aparecerán en esta sección.
                  </span>
                </div>
              ) : (
                <div className="dashboard-movements">
                  {displayedMovements.map(
                    (movement) => {
                      const isPositive =
                        movement.movement_type ===
                          "ENTRADA" ||
                        movement.movement_type ===
                          "AJUSTE_POSITIVO";

                      return (
                        <article
                          key={movement.id}
                          className="dashboard-movement"
                        >
                          <div
                            className={
                              isPositive
                                ? "dashboard-movement__icon dashboard-movement__icon--positive"
                                : movement.movement_type ===
                                    "MERMA"
                                  ? "dashboard-movement__icon dashboard-movement__icon--loss"
                                  : "dashboard-movement__icon dashboard-movement__icon--negative"
                            }
                          >
                            {getMovementIcon(
                              movement.movement_type,
                            )}
                          </div>

                          <div className="dashboard-movement__identity">
                            <strong>
                              {
                                movement.product_name
                              }
                            </strong>

                            <span>
                              {
                                movementLabels[
                                  movement
                                    .movement_type
                                ]
                              }{" "}
                              ·{" "}
                              {formatDateTime(
                                movement.movement_date,
                              )}
                            </span>
                          </div>

                          <strong
                            className={
                              isPositive
                                ? "dashboard-movement__quantity dashboard-movement__quantity--positive"
                                : "dashboard-movement__quantity dashboard-movement__quantity--negative"
                            }
                          >
                            {getMovementSign(
                              movement.movement_type,
                            )}
                            {movement.quantity}
                          </strong>
                        </article>
                      );
                    },
                  )}
                </div>
              )}
            </section>

            <aside className="dashboard-actions">
              <header>
                <span>Accesos directos</span>
                <h2>¿Qué deseas hacer?</h2>
              </header>

              <Link
                to="/ventas"
                className="dashboard-action dashboard-action--primary"
              >
                <div>
                  <ShoppingCart size={21} />
                </div>

                <span>
                  <strong>
                    Registrar una venta
                  </strong>

                  <small>
                    Abre el módulo de ventas
                  </small>
                </span>

                <ArrowRight size={18} />
              </Link>

              <Link
                to="/productos"
                className="dashboard-action"
              >
                <div>
                  <Boxes size={21} />
                </div>

                <span>
                  <strong>
                    Gestionar productos
                  </strong>

                  <small>
                    Catálogo y existencias
                  </small>
                </span>

                <ArrowRight size={18} />
              </Link>

              <Link
                to="/inventario"
                className="dashboard-action"
              >
                <div>
                  <ClipboardList size={21} />
                </div>

                <span>
                  <strong>
                    Revisar inventario
                  </strong>

                  <small>
                    Movimientos y ajustes
                  </small>
                </span>

                <ArrowRight size={18} />
              </Link>

              <Link
                to="/reportes"
                className="dashboard-action"
              >
                <div>
                  <TrendingUp size={21} />
                </div>

                <span>
                  <strong>
                    Consultar reportes
                  </strong>

                  <small>
                    Indicadores del negocio
                  </small>
                </span>

                <ArrowRight size={18} />
              </Link>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}

export default DashboardPage;