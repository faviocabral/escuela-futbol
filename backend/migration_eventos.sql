-- Migración: rango horario + días en categorías, y torneos generalizados a eventos
-- Ejecutar en el SQL Editor de Supabase sobre la base existente.

-- Categorías: horario de inicio → fin + días de entrenamiento ('1,3,5' = lun/mié/vie; 0=domingo)
do $$ begin
  alter table categorias rename column hora_entrenamiento to hora_inicio;
exception when undefined_column then
  alter table categorias add column if not exists hora_inicio time;
end $$;

alter table categorias
  add column if not exists hora_fin time,
  add column if not exists dias text;

-- Torneos → eventos: torneo | amistoso | evento + horario propio
alter table torneos
  add column if not exists tipo text not null default 'torneo',
  add column if not exists hora_inicio time,
  add column if not exists hora_fin time;
