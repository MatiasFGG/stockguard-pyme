import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  FolderOpen,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Tags,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";

import {
  createCategory,
  getCategories,
  updateCategory,
} from "../api/categoryApi";

import { getProducts } from "../api/productApi";

import { useAuth } from "../contexts/AuthContext";

import type {
  Category,
  CategoryCreateRequest,
} from "../types/category";

import type { Product } from "../types/product";

import { getApiErrorMessage } from "../utils/getApiErrorMessage";

import "../styles/catalogs.css";

type ActiveFilter =
  | "all"
  | "active"
  | "inactive";

interface CategoryFormModalProps {
  isOpen: boolean;
  category: Category | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

function CategoryFormModal({
  isOpen,
  category,
  onClose,
  onSaved,
}: CategoryFormModalProps) {
  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const isEditing = category !== null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName(category?.name ?? "");

    setDescription(
      category?.description ?? "",
    );

    setErrorMessage("");
    setIsSubmitting(false);
  }, [category, isOpen]);

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

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setErrorMessage("");

    const normalizedName =
      name.trim();

    if (!normalizedName) {
      setErrorMessage(
        "Debes ingresar el nombre de la categoría.",
      );

      return;
    }

    const categoryData: CategoryCreateRequest =
      {
        name: normalizedName,

        description:
          description.trim() || null,
      };

    setIsSubmitting(true);

    try {
      if (category) {
        await updateCategory(
          category.id,
          categoryData,
        );

        onSaved(
          "Categoría actualizada correctamente.",
        );
      } else {
        await createCategory(
          categoryData,
        );

        onSaved(
          "Categoría creada correctamente.",
        );
      }

      onClose();
    } catch (error: unknown) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          isEditing
            ? "No fue posible actualizar la categoría."
            : "No fue posible crear la categoría.",
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
      className="catalog-modal-overlay"
      role="presentation"
      onMouseDown={handleOverlayClick}
    >
      <section
        className="catalog-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
      >
        <header className="catalog-modal__header">
          <div>
            <span className="catalog-modal__eyebrow">
              Organización del catálogo
            </span>

            <h2 id="category-form-title">
              {isEditing
                ? "Editar categoría"
                : "Nueva categoría"}
            </h2>

            <p>
              Define cómo se agruparán los
              productos del negocio.
            </p>
          </div>

          <button
            type="button"
            className="catalog-modal__close"
            aria-label="Cerrar"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </header>

        <form
          className="catalog-form"
          onSubmit={handleSubmit}
        >
          {errorMessage && (
            <div
              className="catalog-form__error"
              role="alert"
            >
              <AlertTriangle size={19} />

              <span>
                {errorMessage}
              </span>
            </div>
          )}

          <label className="catalog-field">
            <span>
              Nombre de la categoría
            </span>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              placeholder="Ejemplo: Bebidas"
              maxLength={100}
              autoFocus
              disabled={isSubmitting}
            />
          </label>

          <label className="catalog-field">
            <span>
              Descripción{" "}
              <small>(opcional)</small>
            </span>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              placeholder="Describe brevemente los productos incluidos..."
              rows={4}
              maxLength={500}
              disabled={isSubmitting}
            />
          </label>

          <footer className="catalog-modal__footer">
            <button
              type="button"
              className="catalog-modal-button catalog-modal-button--secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="catalog-modal-button catalog-modal-button--primary"
              disabled={isSubmitting}
            >
              <Save size={18} />

              <span>
                {isSubmitting
                  ? "Guardando..."
                  : isEditing
                    ? "Guardar cambios"
                    : "Crear categoría"}
              </span>
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function CategoriesPage() {
  const { user } = useAuth();

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [searchInput, setSearchInput] =
    useState("");

  const [
    submittedSearch,
    setSubmittedSearch,
  ] = useState("");

  const [activeFilter, setActiveFilter] =
    useState<ActiveFilter>("all");

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [productsError, setProductsError] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [reloadKey, setReloadKey] =
    useState(0);

  const [
    isFormModalOpen,
    setIsFormModalOpen,
  ] = useState(false);

  const [
    editingCategory,
    setEditingCategory,
  ] = useState<Category | null>(null);

  const isAdministrator =
    user?.role === "ADMINISTRADOR";

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadCategoriesModule() {
      setIsLoading(true);
      setErrorMessage("");
      setProductsError("");

      const [
        categoriesResult,
        productsResult,
      ] = await Promise.allSettled([
        getCategories(
          controller.signal,
        ),

        getProducts(
          {},
          controller.signal,
        ),
      ]);

      if (controller.signal.aborted) {
        return;
      }

      if (
        categoriesResult.status ===
        "fulfilled"
      ) {
        setCategories(
          categoriesResult.value,
        );
      } else {
        setCategories([]);

        setErrorMessage(
          getApiErrorMessage(
            categoriesResult.reason,
            "No fue posible cargar las categorías.",
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
            "No fue posible calcular los productos asociados.",
          ),
        );
      }

      setIsLoading(false);
    }

    void loadCategoriesModule();

    return () => {
      controller.abort();
    };
  }, [reloadKey]);

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

  const productCounts = useMemo(() => {
    return products.reduce<
      Record<number, number>
    >((counts, product) => {
      counts[product.category_id] =
        (counts[product.category_id] ??
          0) + 1;

      return counts;
    }, {});
  }, [products]);

  const filteredCategories =
    useMemo(() => {
      const normalizedSearch =
        submittedSearch
          .trim()
          .toLowerCase();

      return categories.filter(
        (category) => {
          const matchesSearch =
            !normalizedSearch ||
            category.name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            category.description
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesStatus =
            activeFilter === "all" ||
            (activeFilter ===
              "active" &&
              category.active) ||
            (activeFilter ===
              "inactive" &&
              !category.active);

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      activeFilter,
      categories,
      submittedSearch,
    ]);

  const summary = useMemo(() => {
    return {
      total: filteredCategories.length,

      active:
        filteredCategories.filter(
          (category) =>
            category.active,
        ).length,

      withProducts:
        filteredCategories.filter(
          (category) =>
            (productCounts[
              category.id
            ] ?? 0) > 0,
        ).length,
    };
  }, [
    filteredCategories,
    productCounts,
  ]);

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

  function handleOpenCreate() {
    setEditingCategory(null);
    setIsFormModalOpen(true);
  }

  function handleOpenEdit(
    category: Category,
  ) {
    setEditingCategory(category);
    setIsFormModalOpen(true);
  }

  function handleCloseModal() {
    setIsFormModalOpen(false);
    setEditingCategory(null);
  }

  function handleSaved(
    message: string,
  ) {
    setSuccessMessage(message);

    setReloadKey(
      (currentValue) =>
        currentValue + 1,
    );
  }

  return (
    <>
      <section className="catalog-page">
        <header className="catalog-header">
          <div className="catalog-header__copy">
            <div className="catalog-header__icon">
              <Tags size={27} />
            </div>

            <div>
              <h1>Categorías</h1>

              <p>
                Organiza los productos en
                grupos claros y fáciles de
                administrar.
              </p>
            </div>
          </div>

          {isAdministrator && (
            <button
              type="button"
              className="catalog-header__action"
              onClick={handleOpenCreate}
            >
              <Plus size={19} />

              <span>
                Nueva categoría
              </span>
            </button>
          )}
        </header>

        {successMessage && (
          <div
            className="catalog-success"
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
            className="catalog-warning"
            role="alert"
          >
            <AlertTriangle size={19} />

            <span>
              {productsError}
            </span>
          </div>
        )}

        <div className="catalog-summary">
          <article className="catalog-summary-card">
            <div className="catalog-summary-card__icon">
              <Tags size={21} />
            </div>

            <div>
              <span>
                Categorías mostradas
              </span>

              <strong>
                {summary.total}
              </strong>
            </div>
          </article>

          <article className="catalog-summary-card">
            <div className="catalog-summary-card__icon catalog-summary-card__icon--active">
              <CheckCircle2 size={21} />
            </div>

            <div>
              <span>
                Categorías activas
              </span>

              <strong>
                {summary.active}
              </strong>
            </div>
          </article>

          <article className="catalog-summary-card">
            <div className="catalog-summary-card__icon catalog-summary-card__icon--products">
              <Boxes size={21} />
            </div>

            <div>
              <span>
                Con productos asociados
              </span>

              <strong>
                {summary.withProducts}
              </strong>
            </div>
          </article>
        </div>

        <section className="catalog-panel">
          <div className="catalog-toolbar">
            <form
              className="catalog-search"
              onSubmit={handleSearch}
            >
              <div className="catalog-search__field">
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
                  placeholder="Buscar categoría..."
                  aria-label="Buscar categoría"
                />
              </div>

              <button
                type="submit"
                className="catalog-button catalog-button--primary"
              >
                Buscar
              </button>
            </form>

            <div className="catalog-toolbar__actions">
              <label className="catalog-filter">
                <span>Estado</span>

                <select
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
                    Activas
                  </option>

                  <option value="inactive">
                    Inactivas
                  </option>
                </select>
              </label>

              <button
                type="button"
                className="catalog-button catalog-button--secondary"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  size={18}
                  className={
                    isLoading
                      ? "catalog-refresh catalog-refresh--loading"
                      : "catalog-refresh"
                  }
                />

                <span>Actualizar</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div
              className="catalog-message catalog-message--error"
              role="alert"
            >
              <AlertTriangle size={20} />

              <div>
                <strong>
                  No se pudieron cargar
                  las categorías
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
                className="catalog-message"
                role="status"
              >
                <RefreshCw
                  size={21}
                  className="catalog-refresh catalog-refresh--loading"
                />

                <span>
                  Cargando categorías...
                </span>
              </div>
            )}

          {!errorMessage &&
            !isLoading &&
            filteredCategories.length ===
              0 && (
              <div className="catalog-empty">
                <FolderOpen size={43} />

                <h2>
                  No se encontraron
                  categorías
                </h2>

                <p>
                  Prueba con otra búsqueda
                  o cambia el filtro
                  seleccionado.
                </p>
              </div>
            )}

          {!errorMessage &&
            !isLoading &&
            filteredCategories.length >
              0 && (
              <div className="catalog-table-wrapper">
                <table className="catalog-table">
                  <thead>
                    <tr>
                      <th>Categoría</th>
                      <th>Descripción</th>
                      <th>Productos</th>
                      <th>Estado</th>

                      {isAdministrator && (
                        <th className="catalog-table__actions">
                          Acciones
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCategories.map(
                      (category) => (
                        <tr key={category.id}>
                          <td>
                            <div className="catalog-identity">
                              <strong>
                                {category.name}
                              </strong>

                              <span>
                                Categoría #
                                {category.id}
                              </span>
                            </div>
                          </td>

                          <td className="catalog-description">
                            {category.description ??
                              "Sin descripción"}
                          </td>

                          <td>
                            <span className="catalog-count">
                              {productCounts[
                                category.id
                              ] ?? 0}{" "}
                              productos
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                category.active
                                  ? "catalog-state catalog-state--active"
                                  : "catalog-state catalog-state--inactive"
                              }
                            >
                              {category.active
                                ? "Activa"
                                : "Inactiva"}
                            </span>
                          </td>

                          {isAdministrator && (
                            <td className="catalog-table__actions">
                              <button
                                type="button"
                                className="catalog-row-action"
                                aria-label={`Editar ${category.name}`}
                                title="Editar categoría"
                                onClick={() =>
                                  handleOpenEdit(
                                    category,
                                  )
                                }
                              >
                                <Pencil
                                  size={17}
                                />
                              </button>
                            </td>
                          )}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      </section>

      <CategoryFormModal
        isOpen={isFormModalOpen}
        category={editingCategory}
        onClose={handleCloseModal}
        onSaved={handleSaved}
      />
    </>
  );
}

export default CategoriesPage;