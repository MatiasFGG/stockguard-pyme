import {
  AlertTriangle,
  Boxes,
  Building2,
  CheckCircle2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Truck,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";

import { getProducts } from "../api/productApi";

import {
  createSupplier,
  getSuppliers,
  updateSupplier,
} from "../api/supplierApi";

import { useAuth } from "../contexts/AuthContext";

import type { Product } from "../types/product";

import type {
  Supplier,
  SupplierCreateRequest,
} from "../types/supplier";

import { getApiErrorMessage } from "../utils/getApiErrorMessage";

import "../styles/catalogs.css";

type ActiveFilter =
  | "all"
  | "active"
  | "inactive";

interface SupplierFormModalProps {
  isOpen: boolean;
  supplier: Supplier | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

function SupplierFormModal({
  isOpen,
  supplier,
  onClose,
  onSaved,
}: SupplierFormModalProps) {
  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const isEditing = supplier !== null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName(supplier?.name ?? "");
    setPhone(supplier?.phone ?? "");
    setEmail(supplier?.email ?? "");
    setAddress(
      supplier?.address ?? "",
    );

    setErrorMessage("");
    setIsSubmitting(false);
  }, [isOpen, supplier]);

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
        "Debes ingresar el nombre del proveedor.",
      );

      return;
    }

    const supplierData: SupplierCreateRequest =
      {
        name: normalizedName,
        phone: phone.trim() || null,
        email:
          email.trim().toLowerCase() ||
          null,
        address:
          address.trim() || null,
      };

    setIsSubmitting(true);

    try {
      if (supplier) {
        await updateSupplier(
          supplier.id,
          supplierData,
        );

        onSaved(
          "Proveedor actualizado correctamente.",
        );
      } else {
        await createSupplier(
          supplierData,
        );

        onSaved(
          "Proveedor creado correctamente.",
        );
      }

      onClose();
    } catch (error: unknown) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          isEditing
            ? "No fue posible actualizar el proveedor."
            : "No fue posible crear el proveedor.",
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
        aria-labelledby="supplier-form-title"
      >
        <header className="catalog-modal__header">
          <div>
            <span className="catalog-modal__eyebrow">
              Red de abastecimiento
            </span>

            <h2 id="supplier-form-title">
              {isEditing
                ? "Editar proveedor"
                : "Nuevo proveedor"}
            </h2>

            <p>
              Registra los datos de contacto
              del proveedor.
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
              Nombre del proveedor
            </span>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              placeholder="Ejemplo: Distribuidora Central"
              maxLength={150}
              autoFocus
              disabled={isSubmitting}
            />
          </label>

          <div className="catalog-form-grid">
            <label className="catalog-field">
              <span>
                Teléfono{" "}
                <small>(opcional)</small>
              </span>

              <input
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(
                    event.target.value,
                  )
                }
                placeholder="+56 9 1234 5678"
                maxLength={30}
                disabled={isSubmitting}
              />
            </label>

            <label className="catalog-field">
              <span>
                Correo electrónico{" "}
                <small>(opcional)</small>
              </span>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                placeholder="contacto@proveedor.cl"
                disabled={isSubmitting}
              />
            </label>
          </div>

          <label className="catalog-field">
            <span>
              Dirección{" "}
              <small>(opcional)</small>
            </span>

            <textarea
              value={address}
              onChange={(event) =>
                setAddress(
                  event.target.value,
                )
              }
              placeholder="Dirección comercial del proveedor..."
              rows={3}
              maxLength={250}
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
                    : "Crear proveedor"}
              </span>
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function SuppliersPage() {
  const { user } = useAuth();

  const [suppliers, setSuppliers] =
    useState<Supplier[]>([]);

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
    editingSupplier,
    setEditingSupplier,
  ] = useState<Supplier | null>(null);

  const isAdministrator =
    user?.role === "ADMINISTRADOR";

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadSuppliersModule() {
      setIsLoading(true);
      setErrorMessage("");
      setProductsError("");

      const [
        suppliersResult,
        productsResult,
      ] = await Promise.allSettled([
        getSuppliers(
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
        suppliersResult.status ===
        "fulfilled"
      ) {
        setSuppliers(
          suppliersResult.value,
        );
      } else {
        setSuppliers([]);

        setErrorMessage(
          getApiErrorMessage(
            suppliersResult.reason,
            "No fue posible cargar los proveedores.",
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

    void loadSuppliersModule();

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
      if (
        product.supplier_id === null
      ) {
        return counts;
      }

      counts[product.supplier_id] =
        (counts[
          product.supplier_id
        ] ?? 0) + 1;

      return counts;
    }, {});
  }, [products]);

  const filteredSuppliers =
    useMemo(() => {
      const normalizedSearch =
        submittedSearch
          .trim()
          .toLowerCase();

      return suppliers.filter(
        (supplier) => {
          const searchableValues = [
            supplier.name,
            supplier.phone,
            supplier.email,
            supplier.address,
          ];

          const matchesSearch =
            !normalizedSearch ||
            searchableValues.some(
              (value) =>
                value
                  ?.toLowerCase()
                  .includes(
                    normalizedSearch,
                  ),
            );

          const matchesStatus =
            activeFilter === "all" ||
            (activeFilter ===
              "active" &&
              supplier.active) ||
            (activeFilter ===
              "inactive" &&
              !supplier.active);

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      activeFilter,
      submittedSearch,
      suppliers,
    ]);

  const summary = useMemo(() => {
    return {
      total: filteredSuppliers.length,

      active:
        filteredSuppliers.filter(
          (supplier) =>
            supplier.active,
        ).length,

      withProducts:
        filteredSuppliers.filter(
          (supplier) =>
            (productCounts[
              supplier.id
            ] ?? 0) > 0,
        ).length,
    };
  }, [
    filteredSuppliers,
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
    setEditingSupplier(null);
    setIsFormModalOpen(true);
  }

  function handleOpenEdit(
    supplier: Supplier,
  ) {
    setEditingSupplier(supplier);
    setIsFormModalOpen(true);
  }

  function handleCloseModal() {
    setIsFormModalOpen(false);
    setEditingSupplier(null);
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
              <Truck size={27} />
            </div>

            <div>
              <h1>Proveedores</h1>

              <p>
                Administra los contactos y
                fuentes de abastecimiento del
                negocio.
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
                Nuevo proveedor
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
              <Truck size={21} />
            </div>

            <div>
              <span>
                Proveedores mostrados
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
                Proveedores activos
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
                  placeholder="Buscar proveedor, teléfono o correo..."
                  aria-label="Buscar proveedor"
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
                    Activos
                  </option>

                  <option value="inactive">
                    Inactivos
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
                  los proveedores
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
                  Cargando proveedores...
                </span>
              </div>
            )}

          {!errorMessage &&
            !isLoading &&
            filteredSuppliers.length ===
              0 && (
              <div className="catalog-empty">
                <Building2 size={43} />

                <h2>
                  No se encontraron
                  proveedores
                </h2>

                <p>
                  Prueba con otra búsqueda
                  o cambia el filtro.
                </p>
              </div>
            )}

          {!errorMessage &&
            !isLoading &&
            filteredSuppliers.length >
              0 && (
              <div className="catalog-table-wrapper">
                <table className="catalog-table catalog-table--suppliers">
                  <thead>
                    <tr>
                      <th>Proveedor</th>
                      <th>Teléfono</th>
                      <th>Correo</th>
                      <th>Dirección</th>
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
                    {filteredSuppliers.map(
                      (supplier) => (
                        <tr key={supplier.id}>
                          <td>
                            <div className="catalog-identity">
                              <strong>
                                {supplier.name}
                              </strong>

                              <span>
                                Proveedor #
                                {supplier.id}
                              </span>
                            </div>
                          </td>

                          <td>
                            {supplier.phone ? (
                              <span className="catalog-contact">
                                <Phone
                                  size={15}
                                />

                                {
                                  supplier.phone
                                }
                              </span>
                            ) : (
                              <span className="catalog-empty-value">
                                Sin teléfono
                              </span>
                            )}
                          </td>

                          <td>
                            {supplier.email ? (
                              <a
                                className="catalog-contact catalog-contact--link"
                                href={`mailto:${supplier.email}`}
                              >
                                <Mail
                                  size={15}
                                />

                                {
                                  supplier.email
                                }
                              </a>
                            ) : (
                              <span className="catalog-empty-value">
                                Sin correo
                              </span>
                            )}
                          </td>

                          <td>
                            {supplier.address ? (
                              <span className="catalog-contact">
                                <MapPin
                                  size={15}
                                />

                                {
                                  supplier.address
                                }
                              </span>
                            ) : (
                              <span className="catalog-empty-value">
                                Sin dirección
                              </span>
                            )}
                          </td>

                          <td>
                            <span className="catalog-count">
                              {productCounts[
                                supplier.id
                              ] ?? 0}{" "}
                              productos
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                supplier.active
                                  ? "catalog-state catalog-state--active"
                                  : "catalog-state catalog-state--inactive"
                              }
                            >
                              {supplier.active
                                ? "Activo"
                                : "Inactivo"}
                            </span>
                          </td>

                          {isAdministrator && (
                            <td className="catalog-table__actions">
                              <button
                                type="button"
                                className="catalog-row-action"
                                aria-label={`Editar ${supplier.name}`}
                                title="Editar proveedor"
                                onClick={() =>
                                  handleOpenEdit(
                                    supplier,
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

      <SupplierFormModal
        isOpen={isFormModalOpen}
        supplier={editingSupplier}
        onClose={handleCloseModal}
        onSaved={handleSaved}
      />
    </>
  );
}

export default SuppliersPage;