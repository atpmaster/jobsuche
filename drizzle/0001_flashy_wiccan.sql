-- Existing tables and contact columns were created by the legacy runtime.
-- Preserve every record; only add the new reversible-delete marker.
ALTER TABLE applications ADD COLUMN deleted_at TEXT;
