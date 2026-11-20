-- =====================================================
-- Pagos parciales: la cuota conserva su total y acumula abonos
-- Ejecutar en Supabase SQL Editor (idempotente)
-- =====================================================
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS monto_pagado numeric(12,0);
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS monto_declarado numeric(12,0);

-- Backfill: lo ya confirmado queda totalmente abonado
UPDATE pagos SET monto_pagado = monto WHERE estado = 'confirmado' AND monto_pagado IS NULL;
UPDATE pagos SET monto_pagado = 0 WHERE monto_pagado IS NULL;
