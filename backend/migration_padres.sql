-- Migración: portal de padres + pagos con comprobante + motivo de ausencia
-- Ejecutar en el SQL Editor de Supabase sobre la base existente.

-- 1) Usuarios: rol (admin/staff vs padre) y vínculo con su jugador
alter table usuarios
  add column if not exists rol text not null default 'admin',
  add column if not exists jugador_id bigint references jugadores(id) on delete set null;

-- Una sola cuenta de padre por jugador
create unique index if not exists usuarios_jugador_uk
  on usuarios (jugador_id) where jugador_id is not null;

-- 2) Registros de asistencia: quién marcó y motivo de ausencia
alter table asistencia_registros
  add column if not exists origen text not null default 'staff',
  add column if not exists motivo_ausencia text;

-- 3) Pagos: flujo de aprobación + datos del comprobante
alter table pagos
  add column if not exists estado text not null default 'confirmado', -- pendiente | confirmado | rechazado
  add column if not exists registrado_por text not null default 'staff', -- staff | padre
  add column if not exists comprobante_url text,
  add column if not exists nro_comprobante text,
  add column if not exists banco text,
  add column if not exists remitente text;

-- Un jugador no puede tener dos pagos "vigentes" del mismo período,
-- pero sí puede reenviar un comprobante si el anterior fue rechazado.
alter table pagos drop constraint if exists pagos_jugador_id_mes_anio_key;
create unique index if not exists pagos_unico_vigente
  on pagos (jugador_id, mes, anio) where estado <> 'rechazado';
