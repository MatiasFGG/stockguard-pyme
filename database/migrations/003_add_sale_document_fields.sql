-- StockGuard PyME
-- Migración 003: campos documentales de ventas

BEGIN;

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS document_type VARCHAR(30);

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS document_number VARCHAR(50);

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS observation TEXT;

COMMIT;

