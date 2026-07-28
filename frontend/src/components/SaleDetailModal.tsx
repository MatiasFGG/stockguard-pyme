import {
  AlertTriangle,
  CalendarDays,
  CreditCard,
  FileText,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  UserRound,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
  type MouseEvent,
} from "react";

import { getSaleById } from "../api/saleApi";

import type {
  SaleDetailResponse,
} from "../types/sale";

import { formatCurrency } from "../utils/formatCurrency";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

interface SaleDetailModalProps {
  isOpen: boolean;
  saleId: number | null;
  onClose: () => void;
}

const paymentMethodLabels: Record<
  string,
  string
> = {
  EFECTIVO: "Efectivo",
  DEBITO: "Débito",
  CREDITO: "Crédito",
  TRANSFERENCIA: "Transferencia",
};

const documentTypeLabels: Record<
  string,
  string
> = {
  BOLETA: "Boleta",
  FACTURA: "Factura",
};

function SaleDetailModal({
  isOpen,
  saleId,
  onClose,
}: SaleDetailModalProps) {
  const [saleDetail, setSaleDetail] =
    useState<SaleDetailResponse | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    if (!isOpen || saleId === null) {
      return;
    }

    const controller = new AbortController();

    async function loadSaleDetail() {
      setIsLoading(true);
      setErrorMessage("");
      setSaleDetail(null);

      try {
        const result = await getSaleById(
          saleId,
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setSaleDetail(result);
        }
      } catch (error: unknown) {
        if (controller.signal.aborted) {
          return;
        }

        setErrorMessage(
          getApiErrorMessage(
            error,
            "No fue posible cargar el detalle de la venta.",
          ),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadSaleDetail();

    return () => {
      controller.abort();
    };
  }, [isOpen, saleId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
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
  }, [isOpen, onClose]);

  function handleOverlayClick(
    event: MouseEvent<HTMLDivElement>,
  ) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(
      "es-CL",
      {
        dateStyle: "long",
        timeStyle: "short",
      },
    ).format(date);
  }

  if (!isOpen || saleId === null) {
    return null;
  }

  return (
    <div
      className="sale-detail-overlay"
      role="presentation"
      onMouseDown={handleOverlayClick}
    >
      <section
        className="sale-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sale-detail-title"
      >
        <header className="sale-detail-header">
          <div className="sale-detail-header__copy">
            <div className="sale-detail-header__icon">
              <ReceiptText size={24} />
            </div>

            <div>
              <span>Comprobante de venta</span>

              <h2 id="sale-detail-title">
                Venta #{saleId}
              </h2>

              <p>
                Información general y productos
                incluidos en la operación.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="sale-detail-close"
            aria-label="Cerrar detalle"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>

        <div className="sale-detail-content">
          {isLoading && (
            <div
              className="sale-detail-message"
              role="status"
            >
              <RefreshCw
                size={22}
                className="sales-refresh sales-refresh--loading"
              />

              <span>
                Cargando detalle de la venta...
              </span>
            </div>
          )}

          {!isLoading && errorMessage && (
            <div
              className="sale-detail-error"
              role="alert"
            >
              <AlertTriangle size={20} />

              <div>
                <strong>
                  No se pudo cargar la venta
                </strong>

                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {!isLoading &&
            !errorMessage &&
            saleDetail && (
              <>
                <div className="sale-detail-summary">
                  <article>
                    <CalendarDays size={19} />

                    <div>
                      <span>Fecha</span>

                      <strong>
                        {formatDate(
                          saleDetail.sale
                            .sale_date,
                        )}
                      </strong>
                    </div>
                  </article>

                  <article>
                    <CreditCard size={19} />

                    <div>
                      <span>
                        Método de pago
                      </span>

                      <strong>
                        {paymentMethodLabels[
                          saleDetail.sale
                            .payment_method
                        ] ??
                          saleDetail.sale
                            .payment_method}
                      </strong>
                    </div>
                  </article>

                  <article>
                    <FileText size={19} />

                    <div>
                      <span>Documento</span>

                      <strong>
                        {saleDetail.sale
                          .document_type
                          ? `${
                              documentTypeLabels[
                                saleDetail.sale
                                  .document_type
                              ] ??
                              saleDetail.sale
                                .document_type
                            } ${
                              saleDetail.sale
                                .document_number ??
                              ""
                            }`
                          : "Sin documento"}
                      </strong>
                    </div>
                  </article>

                  <article>
                    <UserRound size={19} />

                    <div>
                      <span>
                        Registrada por
                      </span>

                      <strong>
                        {saleDetail.sale
                          .created_by_full_name ??
                          saleDetail.sale
                            .created_by_username ??
                          "Usuario no disponible"}
                      </strong>
                    </div>
                  </article>
                </div>

                {saleDetail.sale.observation && (
                  <div className="sale-detail-observation">
                    <span>Observación</span>

                    <p>
                      {
                        saleDetail.sale
                          .observation
                      }
                    </p>
                  </div>
                )}

                <div className="sale-detail-table-wrapper">
                  <table className="sale-detail-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio unitario</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>

                    <tbody>
                      {saleDetail.details.map(
                        (detail) => (
                          <tr key={detail.id}>
                            <td>
                              <div className="sale-detail-product">
                                <PackageCheck
                                  size={18}
                                />

                                <div>
                                  <strong>
                                    {
                                      detail.product_name
                                    }
                                  </strong>

                                  <span>
                                    Producto #
                                    {
                                      detail.product_id
                                    }
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td>
                              {detail.quantity}
                            </td>

                            <td>
                              {formatCurrency(
                                detail.unit_price,
                              )}
                            </td>

                            <td className="sale-detail-subtotal">
                              {formatCurrency(
                                detail.subtotal,
                              )}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>

                <footer className="sale-detail-total">
                  <div>
                    <span>Total de la venta</span>

                    <strong>
                      {formatCurrency(
                        saleDetail.sale.total,
                      )}
                    </strong>
                  </div>
                </footer>
              </>
            )}
        </div>
      </section>
    </div>
  );
}

export default SaleDetailModal;