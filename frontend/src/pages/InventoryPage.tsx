import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  ClipboardList,
  PackageMinus,
  PackageSearch,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { getInventoryMovements } from "../api/inventoryApi";
import { getProducts } from "../api/productApi";

import StockAdjustmentModal from "../components/StockAdjustmentModal";

import { useAuth } from "../contexts/AuthContext";

import type {
  InventoryMovement,
  InventoryMovementType,
  StockAdjustmentResponse,
} from "../types/inventory";

import type { Product } from "../types/product";

import { getApiErrorMessage } from "../utils/getApiErrorMessage";

import "../styles/inventory.css";

type MovementFilter =
  | "all"
  | InventoryMovementType;

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

function InventoryPage() {
  const { user } = useAuth();

  const [movements, setMovements] =
    useState<InventoryMovement[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [searchInput, setSearchInput] =
    useState("");

  const [submittedSearch, setSubmittedSearch] =
    useState("");

  const [movementFilter, setMovementFilter] =
    useState<MovementFilter>("all");

  const [dateFrom, setDateFrom] =
    useState("");

  const [dateTo, setDateTo] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [productsError, setProductsError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [reloadKey, setReloadKey] =
    useState(0);

  const [
    isAdjustmentModalOpen,
    setIsAdjustmentModalOpen,
  ] = useState(false);

  const isAdministrator =
    user?.role === "ADMINISTRADOR";

  useEffect(() => {
    const controller = new AbortController();

    async function loadInventory() {
      setIsLoading(true);
      setErrorMessage("");
      setProductsError("");

      const movementsPromise =
        getInventoryMovements(
          controller.signal,
        );

      const productsPromise = getProducts(
        {
          active: true,
        },
        controller.signal,
      );

      const [
        movementsResult,
        productsResult,
      ] = await Promise.allSettled([
        movementsPromise,
        productsPromise,
      ]);

      if (controller.signal.aborted) {
        return;
      }

      if (
        movementsResult.status ===
        "fulfilled"
      ) {
        setMovements(movementsResult.value);
      } else {
        setErrorMessage(
          getApiErrorMessage(
            movementsResult.reason,
            "No fue posible cargar el historial de inventario.",
          ),
        );
      }

      if (
        productsResult.status ===
        "fulfilled"
      ) {
        setProducts(productsResult.value);
      } else {
        setProductsError(
          getApiErrorMessage(
            productsResult.reason,
            "No fue posible cargar los productos para realizar ajustes.",
          ),
        );
      }

      setIsLoading(false);
    }

    void loadInventory();

    return () => {
      controller.abort();
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = window.setTimeout(
      () => {
        setSuccessMessage("");
      },
      5000,
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [successMessage]);

  const filteredMovements = useMemo(() => {
    const normalizedSearch =
      submittedSearch.trim().toLowerCase();

    return movements.filter((movement) => {
      const matchesSearch =
        !normalizedSearch ||
        movement.product_name
          .toLowerCase()
          .includes(normalizedSearch) ||
        movement.reason
          .toLowerCase()
          .includes(normalizedSearch) ||
        movement.reference
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesType =
        movementFilter === "all" ||
        movement.movement_type ===
          movementFilter;

      const movementDate =
        movement.movement_date.slice(0, 10);

      const matchesDateFrom =
        !dateFrom ||
        movementDate >= dateFrom;

      const matchesDateTo =
        !dateTo ||
        movementDate <= dateTo;

      return (
        matchesSearch &&
        matchesType &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [
    dateFrom,
    dateTo,
    movementFilter,
    movements,
    submittedSearch,
  ]);

  const summary = useMemo(() => {
    return filteredMovements.reduce(
      (result, movement) => {
        const quantity = Number(
          movement.quantity,
        );

        result.total += 1;

        if (
          movement.movement_type ===
            "ENTRADA" ||
          movement.movement_type ===
            "AJUSTE_POSITIVO"
        ) {
          result.incoming += quantity;
        }

        if (
          movement.movement_type ===
            "VENTA" ||
          movement.movement_type ===
            "AJUSTE_NEGATIVO"
        ) {
          result.outgoing += quantity;
        }

        if (
          movement.movement_type ===
          "MERMA"
        ) {
          result.losses += quantity;
        }

        return result;
      },
      {
        total: 0,
        incoming: 0,
        outgoing: 0,
        losses: 0,
      },
    );
  }, [filteredMovements]);

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
    setMovementFilter("all");
    setDateFrom("");
    setDateTo("");
  }

  function handleAdjusted(
    result: StockAdjustmentResponse,
  ) {
    setSuccessMessage(
      `Stock de ${result.product.name} actualizado correctamente. Nuevo stock: ${result.product.current_stock}.`,
    );

    setReloadKey(
      (currentValue) =>
        currentValue + 1,
    );
  }

  function formatMovementDate(
    value: string,
  ) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
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

  function getMovementClass(
    movementType: InventoryMovementType,
  ) {
    return `inventory-movement inventory-movement--${movementType.toLowerCase()}`;
  }

  function getQuantitySign(
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

  const hasActiveFilters =
    submittedSearch !== "" ||
    movementFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";

  return (
    <>
      <section className="inventory-page">
        <header className="inventory-header">
          <div className="inventory-header__copy">
            <div className="inventory-header__icon">
              <PackageSearch size={27} />
            </div>

            <div>
              <h1>Inventario</h1>

              <p>
                Consulta el historial de
                movimientos y administra las
                existencias del negocio.
              </p>
            </div>
          </div>

          {isAdministrator && (
            <button
              type="button"
              className="inventory-header__action"
              onClick={() =>
                setIsAdjustmentModalOpen(
                  true,
                )
              }
              disabled={
                products.length === 0
              }
            >
              <Plus size={19} />
              <span>Ajustar stock</span>
            </button>
          )}
        </header>

        {successMessage && (
          <div
            className="inventory-success"
            role="status"
          >
            <CheckCircle2 size={20} />
            <span>{successMessage}</span>
          </div>
        )}

        {productsError &&
          isAdministrator && (
            <div
              className="inventory-warning"
              role="alert"
            >
              <AlertTriangle size={19} />
              <span>{productsError}</span>
            </div>
          )}

        <div className="inventory-summary">
          <article className="inventory-summary-card">
            <div className="inventory-summary-card__icon">
              <ClipboardList size={21} />
            </div>

            <div>
              <span>
                Movimientos mostrados
              </span>
              <strong>{summary.total}</strong>
            </div>
          </article>

          <article className="inventory-summary-card">
            <div className="inventory-summary-card__icon inventory-summary-card__icon--incoming">
              <ArrowDownToLine size={21} />
            </div>

            <div>
              <span>
                Unidades ingresadas
              </span>
              <strong>
                {summary.incoming}
              </strong>
            </div>
          </article>

          <article className="inventory-summary-card">
            <div className="inventory-summary-card__icon inventory-summary-card__icon--outgoing">
              <ArrowUpFromLine size={21} />
            </div>

            <div>
              <span>
                Unidades descontadas
              </span>
              <strong>
                {summary.outgoing}
              </strong>
            </div>
          </article>

          <article className="inventory-summary-card">
            <div className="inventory-summary-card__icon inventory-summary-card__icon--loss">
              <PackageMinus size={21} />
            </div>

            <div>
              <span>Unidades por merma</span>
              <strong>
                {summary.losses}
              </strong>
            </div>
          </article>
        </div>

        <section className="inventory-panel">
          <div className="inventory-toolbar">
            <form
              className="inventory-search"
              onSubmit={handleSearch}
            >
              <div className="inventory-search__field">
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
                  placeholder="Buscar producto, motivo o referencia..."
                  aria-label="Buscar movimiento"
                />
              </div>

              <button
                type="submit"
                className="inventory-button inventory-button--primary"
              >
                Buscar
              </button>
            </form>

            <div className="inventory-toolbar__actions">
              <label
                className="inventory-filter"
                htmlFor="inventory-type-filter"
              >
                <span>Tipo de movimiento</span>

                <select
                  id="inventory-type-filter"
                  value={movementFilter}
                  onChange={(event) =>
                    setMovementFilter(
                      event.target
                        .value as MovementFilter,
                    )
                  }
                >
                  <option value="all">
                    Todos
                  </option>

                  <option value="ENTRADA">
                    Entradas
                  </option>

                  <option value="VENTA">
                    Ventas
                  </option>

                  <option value="AJUSTE_POSITIVO">
                    Ajustes positivos
                  </option>

                  <option value="AJUSTE_NEGATIVO">
                    Ajustes negativos
                  </option>

                  <option value="MERMA">
                    Mermas
                  </option>
                </select>
              </label>

              <label
                className="inventory-filter"
                htmlFor="inventory-date-from"
              >
                <span>Desde</span>

                <input
                  id="inventory-date-from"
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(event) =>
                    setDateFrom(
                      event.target.value,
                    )
                  }
                />
              </label>

              <label
                className="inventory-filter"
                htmlFor="inventory-date-to"
              >
                <span>Hasta</span>

                <input
                  id="inventory-date-to"
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
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
                  className="inventory-button inventory-button--secondary"
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
                className="inventory-button inventory-button--secondary"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  size={18}
                  className={
                    isLoading
                      ? "inventory-refresh inventory-refresh--loading"
                      : "inventory-refresh"
                  }
                />

                <span>Actualizar</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div
              className="inventory-message inventory-message--error"
              role="alert"
            >
              <AlertTriangle size={20} />

              <div>
                <strong>
                  No se pudo cargar el
                  inventario
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

          {!errorMessage && isLoading && (
            <div
              className="inventory-message"
              role="status"
            >
              <RefreshCw
                size={21}
                className="inventory-refresh inventory-refresh--loading"
              />

              <span>
                Cargando movimientos...
              </span>
            </div>
          )}

          {!errorMessage &&
            !isLoading &&
            filteredMovements.length ===
              0 && (
              <div className="inventory-empty">
                <PackageSearch size={43} />

                <h2>
                  No se encontraron
                  movimientos
                </h2>

                <p>
                  Prueba con otra búsqueda o
                  cambia los filtros
                  seleccionados.
                </p>
              </div>
            )}

          {!errorMessage &&
            !isLoading &&
            filteredMovements.length >
              0 && (
              <div className="inventory-table-wrapper">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Producto</th>
                      <th>Movimiento</th>
                      <th>Cantidad</th>
                      <th>Motivo</th>
                      <th>Referencia</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredMovements.map(
                      (movement) => (
                        <tr key={movement.id}>
                          <td className="inventory-date">
                            {formatMovementDate(
                              movement.movement_date,
                            )}
                          </td>

                          <td>
                            <div className="inventory-product">
                              <strong>
                                {
                                  movement.product_name
                                }
                              </strong>

                              <span>
                                ID del producto:{" "}
                                {
                                  movement.product_id
                                }
                              </span>
                            </div>
                          </td>

                          <td>
                            <span
                              className={getMovementClass(
                                movement.movement_type,
                              )}
                            >
                              {
                                movementLabels[
                                  movement
                                    .movement_type
                                ]
                              }
                            </span>
                          </td>

                          <td>
                            <strong
                              className={
                                getQuantitySign(
                                  movement.movement_type,
                                ) === "+"
                                  ? "inventory-quantity inventory-quantity--positive"
                                  : "inventory-quantity inventory-quantity--negative"
                              }
                            >
                              {getQuantitySign(
                                movement.movement_type,
                              )}
                              {
                                movement.quantity
                              }
                            </strong>
                          </td>

                          <td className="inventory-reason">
                            {movement.reason}
                          </td>

                          <td>
                            {movement.reference ? (
                              <span className="inventory-reference">
                                {
                                  movement.reference
                                }
                              </span>
                            ) : (
                              <span className="inventory-reference-empty">
                                Sin referencia
                              </span>
                            )}
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

      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        products={products}
        onClose={() =>
          setIsAdjustmentModalOpen(false)
        }
        onAdjusted={handleAdjusted}
      />
    </>
  );
}

export default InventoryPage;