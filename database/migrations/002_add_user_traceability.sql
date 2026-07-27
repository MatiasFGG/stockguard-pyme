-- StockGuard PyME
-- Migración 002: trazabilidad de usuarios en ventas e inventario

BEGIN;

ALTER TABLE sales
ADD COLUMN created_by_user_id INTEGER;

ALTER TABLE sales
ADD CONSTRAINT fk_sales_created_by_user
    FOREIGN KEY (created_by_user_id)
    REFERENCES users(id)
    ON DELETE RESTRICT;

CREATE INDEX idx_sales_created_by_user_id
    ON sales(created_by_user_id);


ALTER TABLE inventory_movements
ADD COLUMN performed_by_user_id INTEGER;

ALTER TABLE inventory_movements
ADD CONSTRAINT fk_inventory_movements_performed_by_user
    FOREIGN KEY (performed_by_user_id)
    REFERENCES users(id)
    ON DELETE RESTRICT;

CREATE INDEX idx_inventory_movements_performed_by_user_id
    ON inventory_movements(performed_by_user_id);


COMMENT ON COLUMN sales.created_by_user_id
    IS 'Usuario que registró la venta';

COMMENT ON COLUMN inventory_movements.performed_by_user_id
    IS 'Usuario que realizó el movimiento de inventario';

COMMIT;
