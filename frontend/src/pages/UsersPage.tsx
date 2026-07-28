import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  KeyRound,
  Mail,
  Pencil,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  UserCheck,
  UserCog,
  Users,
  UserX,
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
  createUser,
  getUsers,
  resetUserPassword,
  updateUser,
  updateUserStatus,
} from "../api/userApi";

import { useAuth } from "../contexts/AuthContext";

import type {
  SystemUser,
  UserCreateRequest,
  UserRole,
  UserUpdateRequest,
} from "../types/user";

import { getApiErrorMessage } from "../utils/getApiErrorMessage";

import "../styles/users.css";

type StatusFilter =
  | "all"
  | "active"
  | "inactive";

type RoleFilter =
  | "all"
  | UserRole;

type UserModalMode =
  | "create"
  | "edit"
  | "status"
  | "password";

interface UserModalProps {
  mode: UserModalMode;
  user: SystemUser | null;
  currentUserId: number | undefined;
  onClose: () => void;
  onSaved: (message: string) => void;
}

function UserModal({
  mode,
  user,
  currentUserId,
  onClose,
  onSaved,
}: UserModalProps) {
  const [fullName, setFullName] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [role, setRole] =
    useState<UserRole>("VENDEDOR");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    mustChangePassword,
    setMustChangePassword,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const isCreateMode =
    mode === "create";

  const isEditMode =
    mode === "edit";

  const isStatusMode =
    mode === "status";

  const isPasswordMode =
    mode === "password";

  useEffect(() => {
    setFullName(user?.full_name ?? "");
    setUsername(user?.username ?? "");
    setEmail(user?.email ?? "");
    setRole(user?.role ?? "VENDEDOR");

    setPassword("");
    setConfirmPassword("");
    setMustChangePassword(true);

    setErrorMessage("");
    setIsSubmitting(false);
  }, [mode, user]);

  useEffect(() => {
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
  }, [isSubmitting, onClose]);

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

  function validatePassword() {
    if (password.length < 10) {
      setErrorMessage(
        "La contraseña debe tener al menos 10 caracteres.",
      );

      return false;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        "Las contraseñas no coinciden.",
      );

      return false;
    }

    return true;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setErrorMessage("");

    setIsSubmitting(true);

    try {
      if (isCreateMode) {
        const normalizedFullName =
          fullName.trim();

        const normalizedUsername =
          username.trim();

        if (normalizedFullName.length < 3) {
          setErrorMessage(
            "El nombre debe tener al menos 3 caracteres.",
          );

          return;
        }

        if (
          normalizedUsername.length < 3
        ) {
          setErrorMessage(
            "El nombre de usuario debe tener al menos 3 caracteres.",
          );

          return;
        }

        if (
          !/^[A-Za-z0-9._-]+$/.test(
            normalizedUsername,
          )
        ) {
          setErrorMessage(
            "El nombre de usuario solo puede contener letras, números, puntos, guiones y guion bajo.",
          );

          return;
        }

        if (!validatePassword()) {
          return;
        }

        const userData: UserCreateRequest =
          {
            full_name:
              normalizedFullName,

            username:
              normalizedUsername,

            email:
              email.trim().toLowerCase() ||
              null,

            password,

            role,

            must_change_password:
              mustChangePassword,
          };

        await createUser(userData);

        onSaved(
          "Usuario creado correctamente.",
        );
      }

      if (isEditMode && user) {
        const normalizedFullName =
          fullName.trim();

        if (normalizedFullName.length < 3) {
          setErrorMessage(
            "El nombre debe tener al menos 3 caracteres.",
          );

          return;
        }

        const userData: UserUpdateRequest =
          {
            full_name:
              normalizedFullName,

            email:
              email.trim().toLowerCase() ||
              null,

            role,
          };

        await updateUser(
          user.id,
          userData,
        );

        onSaved(
          "Usuario actualizado correctamente.",
        );
      }

      if (isStatusMode && user) {
        if (
          user.id === currentUserId &&
          user.active
        ) {
          setErrorMessage(
            "No puedes desactivar tu propio usuario.",
          );

          return;
        }

        await updateUserStatus(
          user.id,
          {
            active: !user.active,
          },
        );

        onSaved(
          user.active
            ? "Usuario desactivado correctamente."
            : "Usuario reactivado correctamente.",
        );
      }

      if (isPasswordMode && user) {
        if (!validatePassword()) {
          return;
        }

        await resetUserPassword(
          user.id,
          {
            password,
            must_change_password:
              mustChangePassword,
          },
        );

        onSaved(
          "Contraseña restablecida correctamente.",
        );
      }

      onClose();
    } catch (error: unknown) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "No fue posible completar la operación.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function getTitle() {
    if (isCreateMode) {
      return "Nuevo usuario";
    }

    if (isEditMode) {
      return "Editar usuario";
    }

    if (isPasswordMode) {
      return "Restablecer contraseña";
    }

    return user?.active
      ? "Desactivar usuario"
      : "Reactivar usuario";
  }

  function getDescription() {
    if (isCreateMode) {
      return "Crea una cuenta y asigna su rol dentro de StockGuard.";
    }

    if (isEditMode) {
      return "Modifica los datos personales y permisos del usuario.";
    }

    if (isPasswordMode) {
      return "Define una nueva contraseña temporal para la cuenta.";
    }

    return user?.active
      ? "La cuenta perderá acceso al sistema, pero conservará su historial."
      : "La cuenta recuperará el acceso al sistema.";
  }

  return (
    <div
      className="user-modal-overlay"
      role="presentation"
      onMouseDown={handleOverlayClick}
    >
      <section
        className="user-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-modal-title"
      >
        <header className="user-modal__header">
          <div>
            <span className="user-modal__eyebrow">
              Administración de acceso
            </span>

            <h2 id="user-modal-title">
              {getTitle()}
            </h2>

            <p>{getDescription()}</p>
          </div>

          <button
            type="button"
            className="user-modal__close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </header>

        <form
          className="user-form"
          onSubmit={handleSubmit}
        >
          {errorMessage && (
            <div
              className="user-form__error"
              role="alert"
            >
              <AlertTriangle size={19} />

              <span>
                {errorMessage}
              </span>
            </div>
          )}

          {(isCreateMode ||
            isEditMode) && (
            <>
              <label className="user-field">
                <span>Nombre completo</span>

                <input
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(
                      event.target.value,
                    )
                  }
                  placeholder="Ejemplo: Ana González"
                  maxLength={150}
                  autoFocus
                  disabled={isSubmitting}
                />
              </label>

              {isCreateMode && (
                <label className="user-field">
                  <span>
                    Nombre de usuario
                  </span>

                  <input
                    type="text"
                    value={username}
                    onChange={(event) =>
                      setUsername(
                        event.target.value,
                      )
                    }
                    placeholder="Ejemplo: ana.gonzalez"
                    maxLength={50}
                    disabled={isSubmitting}
                  />

                  <small>
                    Solo letras, números,
                    puntos, guiones y guion
                    bajo.
                  </small>
                </label>
              )}

              <div className="user-form-grid">
                <label className="user-field">
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
                    placeholder="usuario@correo.cl"
                    disabled={isSubmitting}
                  />
                </label>

                <label className="user-field">
                  <span>Rol</span>

                  <select
                    value={role}
                    onChange={(event) =>
                      setRole(
                        event.target
                          .value as UserRole,
                      )
                    }
                    disabled={isSubmitting}
                  >
                    <option value="VENDEDOR">
                      Vendedor
                    </option>

                    <option value="ADMINISTRADOR">
                      Administrador
                    </option>
                  </select>
                </label>
              </div>
            </>
          )}

          {(isCreateMode ||
            isPasswordMode) && (
            <>
              <div className="user-form-grid">
                <label className="user-field">
                  <span>
                    Nueva contraseña
                  </span>

                  <input
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                    placeholder="Mínimo 10 caracteres"
                    maxLength={128}
                    autoFocus={isPasswordMode}
                    disabled={isSubmitting}
                  />
                </label>

                <label className="user-field">
                  <span>
                    Confirmar contraseña
                  </span>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value,
                      )
                    }
                    placeholder="Repite la contraseña"
                    maxLength={128}
                    disabled={isSubmitting}
                  />
                </label>
              </div>

              <label className="user-checkbox">
                <input
                  type="checkbox"
                  checked={
                    mustChangePassword
                  }
                  onChange={(event) =>
                    setMustChangePassword(
                      event.target.checked,
                    )
                  }
                  disabled={isSubmitting}
                />

                <span>
                  Exigir cambio de contraseña
                  al iniciar sesión
                </span>
              </label>
            </>
          )}

          {isStatusMode && user && (
            <div className="user-status-preview">
              <div
                className={
                  user.active
                    ? "user-status-preview__icon user-status-preview__icon--deactivate"
                    : "user-status-preview__icon user-status-preview__icon--activate"
                }
              >
                {user.active ? (
                  <PowerOff size={24} />
                ) : (
                  <Power size={24} />
                )}
              </div>

              <div>
                <strong>
                  {user.full_name}
                </strong>

                <span>
                  @{user.username}
                </span>

                <p>
                  Estado actual:{" "}
                  {user.active
                    ? "Activo"
                    : "Inactivo"}
                </p>
              </div>
            </div>
          )}

          <footer className="user-modal__footer">
            <button
              type="button"
              className="user-modal-button user-modal-button--secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className={
                isStatusMode &&
                user?.active
                  ? "user-modal-button user-modal-button--danger"
                  : "user-modal-button user-modal-button--primary"
              }
              disabled={isSubmitting}
            >
              {isStatusMode ? (
                user?.active ? (
                  <PowerOff size={18} />
                ) : (
                  <Power size={18} />
                )
              ) : isPasswordMode ? (
                <KeyRound size={18} />
              ) : (
                <Save size={18} />
              )}

              <span>
                {isSubmitting
                  ? "Procesando..."
                  : isCreateMode
                    ? "Crear usuario"
                    : isEditMode
                      ? "Guardar cambios"
                      : isPasswordMode
                        ? "Restablecer contraseña"
                        : user?.active
                          ? "Desactivar"
                          : "Reactivar"}
              </span>
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function UsersPage() {
  const { user: currentUser } =
    useAuth();

  const [users, setUsers] =
    useState<SystemUser[]>([]);

  const [searchInput, setSearchInput] =
    useState("");

  const [
    submittedSearch,
    setSubmittedSearch,
  ] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [roleFilter, setRoleFilter] =
    useState<RoleFilter>("all");

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [reloadKey, setReloadKey] =
    useState(0);

  const [modalMode, setModalMode] =
    useState<UserModalMode | null>(
      null,
    );

  const [
    selectedUser,
    setSelectedUser,
  ] = useState<SystemUser | null>(
    null,
  );

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadUsers() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const userList =
          await getUsers(
            controller.signal,
          );

        if (
          !controller.signal.aborted
        ) {
          setUsers(userList);
        }
      } catch (error: unknown) {
        if (
          controller.signal.aborted
        ) {
          return;
        }

        setErrorMessage(
          getApiErrorMessage(
            error,
            "No fue posible cargar los usuarios.",
          ),
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setIsLoading(false);
        }
      }
    }

    void loadUsers();

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

  const filteredUsers =
    useMemo(() => {
      const normalizedSearch =
        submittedSearch
          .trim()
          .toLowerCase();

      return users.filter(
        (systemUser) => {
          const matchesSearch =
            !normalizedSearch ||
            systemUser.full_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            systemUser.username
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            systemUser.email
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesStatus =
            statusFilter === "all" ||
            (statusFilter ===
              "active" &&
              systemUser.active) ||
            (statusFilter ===
              "inactive" &&
              !systemUser.active);

          const matchesRole =
            roleFilter === "all" ||
            systemUser.role ===
              roleFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesRole
          );
        },
      );
    }, [
      roleFilter,
      statusFilter,
      submittedSearch,
      users,
    ]);

  const summary = useMemo(() => {
    return {
      total: filteredUsers.length,

      active:
        filteredUsers.filter(
          (systemUser) =>
            systemUser.active,
        ).length,

      administrators:
        filteredUsers.filter(
          (systemUser) =>
            systemUser.role ===
            "ADMINISTRADOR",
        ).length,

      pendingPassword:
        filteredUsers.filter(
          (systemUser) =>
            systemUser
              .must_change_password,
        ).length,
    };
  }, [filteredUsers]);

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

  function openModal(
    mode: UserModalMode,
    systemUser: SystemUser | null =
      null,
  ) {
    setSelectedUser(systemUser);
    setModalMode(mode);
  }

  function closeModal() {
    setModalMode(null);
    setSelectedUser(null);
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

  function formatDateTime(
    value: string | null,
  ) {
    if (!value) {
      return "Nunca";
    }

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

  return (
    <>
      <section className="users-page">
        <header className="users-header">
          <div className="users-header__copy">
            <div className="users-header__icon">
              <UserCog size={27} />
            </div>

            <div>
              <h1>Usuarios</h1>

              <p>
                Administra las cuentas,
                permisos y accesos al sistema.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="users-header__action"
            onClick={() =>
              openModal("create")
            }
          >
            <Plus size={19} />

            <span>Nuevo usuario</span>
          </button>
        </header>

        {successMessage && (
          <div
            className="users-success"
            role="status"
          >
            <CheckCircle2 size={20} />

            <span>
              {successMessage}
            </span>
          </div>
        )}

        <div className="users-summary">
          <article className="users-summary-card">
            <div className="users-summary-card__icon">
              <Users size={21} />
            </div>

            <div>
              <span>
                Usuarios mostrados
              </span>

              <strong>
                {summary.total}
              </strong>
            </div>
          </article>

          <article className="users-summary-card">
            <div className="users-summary-card__icon users-summary-card__icon--active">
              <UserCheck size={21} />
            </div>

            <div>
              <span>
                Usuarios activos
              </span>

              <strong>
                {summary.active}
              </strong>
            </div>
          </article>

          <article className="users-summary-card">
            <div className="users-summary-card__icon users-summary-card__icon--admin">
              <ShieldCheck size={21} />
            </div>

            <div>
              <span>
                Administradores
              </span>

              <strong>
                {summary.administrators}
              </strong>
            </div>
          </article>

          <article className="users-summary-card">
            <div className="users-summary-card__icon users-summary-card__icon--password">
              <KeyRound size={21} />
            </div>

            <div>
              <span>
                Cambio pendiente
              </span>

              <strong>
                {summary.pendingPassword}
              </strong>
            </div>
          </article>
        </div>

        <section className="users-panel">
          <div className="users-toolbar">
            <form
              className="users-search"
              onSubmit={handleSearch}
            >
              <div className="users-search__field">
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
                  placeholder="Buscar nombre, usuario o correo..."
                  aria-label="Buscar usuario"
                />
              </div>

              <button
                type="submit"
                className="users-button users-button--primary"
              >
                Buscar
              </button>
            </form>

            <div className="users-toolbar__actions">
              <label className="users-filter">
                <span>Rol</span>

                <select
                  value={roleFilter}
                  onChange={(event) =>
                    setRoleFilter(
                      event.target
                        .value as RoleFilter,
                    )
                  }
                >
                  <option value="all">
                    Todos
                  </option>

                  <option value="ADMINISTRADOR">
                    Administradores
                  </option>

                  <option value="VENDEDOR">
                    Vendedores
                  </option>
                </select>
              </label>

              <label className="users-filter">
                <span>Estado</span>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target
                        .value as StatusFilter,
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
                className="users-button users-button--secondary"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  size={18}
                  className={
                    isLoading
                      ? "users-refresh users-refresh--loading"
                      : "users-refresh"
                  }
                />

                <span>Actualizar</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div
              className="users-message users-message--error"
              role="alert"
            >
              <AlertTriangle size={20} />

              <div>
                <strong>
                  No se pudieron cargar los
                  usuarios
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
                className="users-message"
                role="status"
              >
                <RefreshCw
                  size={21}
                  className="users-refresh users-refresh--loading"
                />

                <span>
                  Cargando usuarios...
                </span>
              </div>
            )}

          {!errorMessage &&
            !isLoading &&
            filteredUsers.length ===
              0 && (
              <div className="users-empty">
                <Users size={43} />

                <h2>
                  No se encontraron usuarios
                </h2>

                <p>
                  Prueba con otra búsqueda o
                  cambia los filtros.
                </p>
              </div>
            )}

          {!errorMessage &&
            !isLoading &&
            filteredUsers.length >
              0 && (
              <div className="users-table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Correo</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Contraseña</th>
                      <th>Último acceso</th>
                      <th className="users-table__actions">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map(
                      (systemUser) => (
                        <tr
                          key={
                            systemUser.id
                          }
                        >
                          <td>
                            <div className="system-user-identity">
                              <div className="system-user-avatar">
                                {systemUser.full_name
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <strong>
                                  {
                                    systemUser.full_name
                                  }
                                </strong>

                                <span>
                                  @
                                  {
                                    systemUser.username
                                  }
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            {systemUser.email ? (
                              <a
                                className="system-user-email"
                                href={`mailto:${systemUser.email}`}
                              >
                                <Mail
                                  size={15}
                                />

                                {
                                  systemUser.email
                                }
                              </a>
                            ) : (
                              <span className="system-user-empty">
                                Sin correo
                              </span>
                            )}
                          </td>

                          <td>
                            <span
                              className={
                                systemUser.role ===
                                "ADMINISTRADOR"
                                  ? "system-user-role system-user-role--admin"
                                  : "system-user-role system-user-role--seller"
                              }
                            >
                              {systemUser.role ===
                              "ADMINISTRADOR"
                                ? "Administrador"
                                : "Vendedor"}
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                systemUser.active
                                  ? "system-user-state system-user-state--active"
                                  : "system-user-state system-user-state--inactive"
                              }
                            >
                              {systemUser.active
                                ? "Activo"
                                : "Inactivo"}
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                systemUser.must_change_password
                                  ? "system-user-password system-user-password--pending"
                                  : "system-user-password system-user-password--ok"
                              }
                            >
                              {systemUser.must_change_password
                                ? "Cambio pendiente"
                                : "Actualizada"}
                            </span>
                          </td>

                          <td>
                            <span className="system-user-login">
                              <Clock3
                                size={15}
                              />

                              {formatDateTime(
                                systemUser.last_login_at,
                              )}
                            </span>
                          </td>

                          <td className="users-table__actions">
                            <div className="system-user-actions">
                              <button
                                type="button"
                                className="system-user-action"
                                title="Editar usuario"
                                onClick={() =>
                                  openModal(
                                    "edit",
                                    systemUser,
                                  )
                                }
                              >
                                <Pencil
                                  size={17}
                                />
                              </button>

                              <button
                                type="button"
                                className="system-user-action system-user-action--password"
                                title="Restablecer contraseña"
                                onClick={() =>
                                  openModal(
                                    "password",
                                    systemUser,
                                  )
                                }
                              >
                                <KeyRound
                                  size={17}
                                />
                              </button>

                              <button
                                type="button"
                                className={
                                  systemUser.active
                                    ? "system-user-action system-user-action--deactivate"
                                    : "system-user-action system-user-action--activate"
                                }
                                title={
                                  systemUser.active
                                    ? "Desactivar usuario"
                                    : "Reactivar usuario"
                                }
                                disabled={
                                  systemUser.id ===
                                    currentUser?.id &&
                                  systemUser.active
                                }
                                onClick={() =>
                                  openModal(
                                    "status",
                                    systemUser,
                                  )
                                }
                              >
                                {systemUser.active ? (
                                  <UserX
                                    size={17}
                                  />
                                ) : (
                                  <UserCheck
                                    size={17}
                                  />
                                )}
                              </button>
                            </div>
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

      {modalMode && (
        <UserModal
          mode={modalMode}
          user={selectedUser}
          currentUserId={
            currentUser?.id
          }
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

export default UsersPage;