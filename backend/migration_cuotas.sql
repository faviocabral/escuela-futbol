-- Migración: cuotas mensuales con vencimiento + configuración global
-- Ejecutar en el SQL Editor de Supabase sobre la base existente (idempotente).

alter table pagos
  add column if not exists vencimiento date,
  add column if not exists detalle text;

-- El estado 'pendiente' (comprobante enviado por el padre) pasa a 'en_revision';
-- 'pendiente' queda para la cuota emitida aún sin pagar.
update pagos set estado = 'en_revision' where estado = 'pendiente';

create table if not exists config (
  clave text primary key,
  valor text not null
);

insert into config (clave, valor) values
  ('cuota_monto', '150000'),
  ('cuota_mes_inicio', '3'),   -- marzo
  ('cuota_mes_fin', '11'),     -- noviembre
  ('cuota_dia_vencimiento', '5')
on conflict (clave) do nothing;
