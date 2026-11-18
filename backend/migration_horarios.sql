-- Migración: horario de entrenamiento por categoría + confirmación de asistencia
-- Ejecutar en el SQL Editor de Supabase sobre la base existente.

-- Horario de inicio del entrenamiento de la categoría (nullable = sin restricción)
alter table categorias
  add column if not exists hora_entrenamiento time;

-- Las marcas del padre quedan 'pendiente' hasta que el staff confirma;
-- las del staff nacen 'confirmado'.
alter table asistencia_registros
  add column if not exists estado text not null default 'confirmado'; -- pendiente | confirmado
