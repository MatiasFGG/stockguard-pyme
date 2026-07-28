import {
  AlertTriangle,
  Boxes,
  PackageCheck,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { getProducts } from "../api/productApi";
import type { Product } from "../types/product";
import { formatCurrency } from "../utils/formatCurrency";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

import "../styles/products.css";

type ActiveFilter =
  | "all"
  | "active"
  | "inactive";

function ProductsPage() {
  const [products, setProducts] = useState<
    Product[]
  >([]);

  const [searchInput, setSearchInput] =
    useState("");

  const [submittedSearch, setSubmittedSearch] =
    useState("");

  const [activeFilter, setActiveFilter] =
    useState<ActiveFilter>("all");

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [reloadKey, setReloadKey] =
    useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const active =
          activeFilter === "all"
            ? undefined
            : activeFilter === "active";

        const productList = await getProducts(
          {
            search:
              submittedSearch || undefined,
            active,
          },
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setProducts(productList);
        }
      } catch (error: unknown) {
        if (controller.signal.aborted) {
          return;
        }

        setErrorMessage(
          getApiErrorMessage(
            error,
            "No fue posible cargar los productos.",
          ),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      controller.abort();
    };
  }, [
    activeFilter,
    reloadKey,
    submittedSearch,
  ]);

  const summary = useMemo(() => {
    const activeProducts = products.filter(
      (product) => product.active,
    ).length;

    const lowStockProducts = products.filter(
      (product) =>
        product.active &&
        Number(product.current_stock) <=
          Number(product.minimum_stock),
    ).length;

    return {
      total: products.length,
      active: activeProducts,
      lowStock: lowStockProducts,
    };
  }, [products]);

  function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSubmittedSearch(searchInput.trim());
  }

  function handleRefresh() {
    setReloadKey((current) => current + 1);
  }

  function getStockStatus(product: Product) {
    const currentStock = Number(
      product.current_stock,
    );

    const minimumStock = Number(
      product.minimum_stock,
    );

    if (currentStock <= 0) {
      return {
        label: "Sin stock",
        className:
          "stock-status stock-status--empty",
      };
    }

    if (currentStock <= minimumStock) {
      return {
        label: "Stock bajo",
        className:
          "stock-status stock-status--low",
      };
    }

    return {
      label: "Disponible",
      className:
        "stock-status stock-status--available",
    };
  }

  return (
    <section className="products-page">
      <header className="products-header">
        <div className="products-header__icon">
          <Boxes size={27} />
        </div>

        <div>
          <h1>Productos</h1>

          <p>
            Consulta el catálogo, los precios y
            las existencias actuales del negocio.
          </p>
        </div>
      </header>

      <div className="product-summary">
        <article className="summary-card">
          <div className="summary-card__icon">
            <Boxes size={21} />
          </div>

          <div>
            <span>Productos mostrados</span>
            <strong>{summary.total}</strong>
          </div>
        </article>

        <article className="summary-card">
          <div className="summary-card__icon">
            <PackageCheck size={21} />
          </div>

          <div>
            <span>Productos activos</span>
            <strong>{summary.active}</strong>
          </div>
        </article>

        <article className="summary-card">
          <div className="summary-card__icon summary-card__icon--warning">
            <AlertTriangle size={21} />
          </div>

          <div>
            <span>Con stock bajo</span>
            <strong>{summary.lowStock}</strong>
          </div>
        </article>
      </div>

      <section className="products-panel">
        <div className="products-toolbar">
          <form
            className="products-search"
            onSubmit={handleSearch}
          >
            <div className="products-search__field">
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
                placeholder="Buscar producto..."
                aria-label="Buscar producto"
              />
            </div>

            <button
              type="submit"
              className="products-button products-button--primary"
            >
              Buscar
            </button>
          </form>

          <div className="products-toolbar__actions">
            <label
              className="products-filter"
              htmlFor="product-status-filter"
            >
              <span>Estado</span>

              <select
                id="product-status-filter"
                value={activeFilter}
                onChange={(event) =>
                  setActiveFilter(
                    event.target
                      .value as ActiveFilter,
                  )
                }
              >
                <option value="all">
                  Todos
                </option>

                <option value="active">
                  Activos
                </option>

                <option value="inactive">
                  Inactivos
                </option>
              </select>
            </label>

            <button
              type="button"
              className="products-button products-button--secondary"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                size={18}
                className={
                  isLoading
                    ? "refresh-icon refresh-icon--loading"
                    : "refresh-icon"
                }
              />

              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div
            className="products-message products-message--error"
            role="alert"
          >
            <AlertTriangle size={20} />

            <div>
              <strong>
                No se pudieron cargar los productos
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
            className="products-message"
            role="status"
          >
            <RefreshCw
              size={21}
              className="refresh-icon refresh-icon--loading"
            />

            <span>
              Cargando productos...
            </span>
          </div>
        )}

        {!errorMessage &&
          !isLoading &&
          products.length === 0 && (
            <div className="products-empty">
              <Boxes size={42} />

              <h2>
                No se encontraron productos
              </h2>

              <p>
                Prueba con otra búsqueda o cambia
                el filtro de estado.
              </p>
            </div>
          )}

        {!errorMessage &&
          !isLoading &&
          products.length > 0 && (
            <div className="products-table-wrapper">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Proveedor</th>
                    <th>Stock</th>
                    <th>Precio de venta</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => {
                    const stockStatus =
                      getStockStatus(product);

                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="product-identity">
                            <strong>
                              {product.name}
                            </strong>

                            <span>
                              {product.barcode
                                ? `Código: ${product.barcode}`
                                : "Sin código de barras"}
                            </span>
                          </div>
                        </td>

                        <td>
                          {product.category_name}
                        </td>

                        <td>
                          {product.supplier_name ??
                            "Sin proveedor"}
                        </td>

                        <td>
                          <div className="product-stock">
                            <strong>
                              {product.current_stock}
                            </strong>

                            <span>
                              Mínimo:{" "}
                              {product.minimum_stock}
                            </span>

                            <small
                              className={
                                stockStatus.className
                              }
                            >
                              {stockStatus.label}
                            </small>
                          </div>
                        </td>

                        <td className="product-price">
                          {formatCurrency(
                            product.sale_price,
                          )}
                        </td>

                        <td>
                          <span
                            className={
                              product.active
                                ? "product-state product-state--active"
                                : "product-state product-state--inactive"
                            }
                          >
                            {product.active
                              ? "Activo"
                              : "Inactivo"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </section>
    </section>
  );
}

export default ProductsPage;