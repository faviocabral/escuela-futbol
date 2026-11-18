-- Escuela de Fútbol — schema para Supabase/Postgres
-- Ejecutar en el SQL Editor de Supabase.

create table if not exists usuarios (
  id bigint generated always as identity primary key,
  usuario text not null unique,
  password_hash text not null,
  nombre text not null,
  rol text not null default 'admin', -- admin/staff vs padre
  jugador_id bigint, -- se completa luego de crear jugadores (references agregada abajo)
  creado_en timestamptz not null default now()
);

create table if not exists entrenadores (
  id bigint generated always as identity primary key,
  nombre text not null,
  apellido text not null,
  telefono text,
  email text,
  creado_en timestamptz not null default now()
);

create table if not exists categorias (
  id bigint generated always as identity primary key,
  nombre text not null,
  edad_min smallint,
  edad_max smallint,
  entrenador_id bigint references entrenadores(id) on delete set null,
  hora_inicio time, -- inicio del entrenamiento; null = sin restricción de horario
  hora_fin time,
  dias text, -- días que entrena: '1,3,5' = lun/mié/vie (0=domingo); null = todos
  creado_en timestamptz not null default now()
);

create table if not exists jugadores (
  id bigint generated always as identity primary key,
  nombre text not null,
  apellido text not null,
  documento text unique,
  fecha_nacimiento date,
  categoria_id bigint references categorias(id) on delete set null,
  tutor text,
  telefono_tutor text,
  activo boolean not null default true,
  foto_url text,
  creado_en timestamptz not null default now()
);

-- "torneos" se usa como tabla de eventos: torneo | amistoso | evento
create table if not exists torneos (
  id bigint generated always as identity primary key,
  nombre text not null,
  fecha date not null,
  lugar text,
  categoria_id bigint references categorias(id) on delete set null,
  tipo text not null default 'torneo',
  hora_inicio time,
  hora_fin time,
  creado_en timestamptz not null default now()
);

create table if not exists convocatorias (
  id bigint generated always as identity primary key,
  torneo_id bigint not null references torneos(id) on delete cascade,
  jugador_id bigint not null references jugadores(id) on delete cascade,
  unique (torneo_id, jugador_id)
);

create table if not exists asistencias (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in ('entrenamiento', 'torneo')),
  fecha date not null,
  categoria_id bigint references categorias(id) on delete set null,
  torneo_id bigint references torneos(id) on delete cascade,
  creado_en timestamptz not null default now()
);

create table if not exists asistencia_registros (
  id bigint generated always as identity primary key,
  asistencia_id bigint not null references asistencias(id) on delete cascade,
  jugador_id bigint not null references jugadores(id) on delete cascade,
  presente boolean not null default false,
  origen text not null default 'staff', -- staff | padre
  estado text not null default 'confirmado', -- pendiente | confirmado (padre marca → staff confirma)
  motivo_ausencia text,
  unique (asistencia_id, jugador_id)
);

create table if not exists pagos (
  id bigint generated always as identity primary key,
  jugador_id bigint not null references jugadores(id) on delete cascade,
  mes smallint not null check (mes between 1 and 12),
  anio smallint not null,
  monto numeric(12,0) not null default 0,
  metodo text,
  fecha_pago date not null default current_date,
  estado text not null default 'confirmado', -- pendiente | confirmado | rechazado
  registrado_por text not null default 'staff', -- staff | padre
  comprobante_url text,
  nro_comprobante text,
  banco text,
  remitente text
);

-- Un pago vigente por jugador/período; los rechazados no bloquean el reenvío
create unique index if not exists pagos_unico_vigente
  on pagos (jugador_id, mes, anio) where estado <> 'rechazado';

do $$ begin
  alter table usuarios
    add constraint usuarios_jugador_fk foreign key (jugador_id) references jugadores(id) on delete set null;
exception when duplicate_object then null; end $$;

create index if not exists idx_jugadores_categoria on jugadores(categoria_id);
create index if not exists idx_asis_reg_planilla on asistencia_registros(asistencia_id);
