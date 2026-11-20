import React, { useState, useRef } from 'react';
import { Avatar } from '../components/Avatar';
import { Paginador } from '../components/Paginador';
import { usePaginacion } from '../hooks/usePaginacion';
import { aviso, confirmar, toast } from '../utils/notify';
import { subirFotoJugador } from '../api';
import { actualizarFotoJugador } from '../store';

const FORM_VACIO = {
  nombre: '', apellido: '', documento: '', fechaNacimiento: '',
  categoriaId: '', tutor: '', telefonoTutor: '', activo: true, foto: null,
  accesoPadre: null, crearAcceso: false, accesoUsuario: '', accesoPassword: '', quitarAcceso: false,
};

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return '-';
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

export const JugadoresView = ({ jugadores, categorias, onAdd, onUpdate, onDelete }) => {
  const [form, setForm] = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [buscar, setBuscar] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const fileInputRef = useRef(null);

  const categoriaNombre = (id) => categorias.find((c) => c.id === Number(id))?.nombre || 'Sin categoría';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((prev) => ({ ...prev, foto: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const resetFormulario = () => {
    setForm(FORM_VACIO);
    setEditandoId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.apellido.trim()) return aviso('Nombre y apellido son obligatorios.');
    if (!form.categoriaId) return aviso('Selecciona una categoría.');

    if (form.crearAcceso && !form.accesoUsuario.trim()) return aviso('Indicá el usuario del padre.');
    if (form.crearAcceso && !editandoId && !form.accesoPassword) return aviso('Indicá la contraseña para el acceso del padre.');

    // La foto no va en el body del jugador: se sube aparte a Storage
    const { foto, accesoPadre, crearAcceso, accesoUsuario, accesoPassword, quitarAcceso, ...resto } = form;
    const registro = { ...resto, categoriaId: Number(form.categoriaId) };
    if (quitarAcceso) {
      registro.accesoPadre = { eliminar: true };
    } else if (crearAcceso && (accesoUsuario || accesoPassword)) {
      registro.accesoPadre = { usuario: accesoUsuario, password: accesoPassword || undefined };
    }
    const guardado = editandoId
      ? await onUpdate({ ...registro, id: editandoId })
      : await onAdd(registro);
    if (!guardado) return; // el error ya se mostró

    // Si eligió una foto nueva (dataURL), la subimos al Storage
    if (foto && foto.startsWith('data:')) {
      try {
        const { foto: fotoUrl } = await subirFotoJugador(guardado.id, foto);
        actualizarFotoJugador(guardado.id, fotoUrl);
      } catch (err) {
        aviso(`El jugador se guardó pero la foto no pudo subirse: ${err.message}`, 'warning');
      }
    }

    toast(editandoId ? 'Jugador actualizado' : 'Jugador registrado');
    resetFormulario();
  };

  const handleEditar = (j) => {
    setForm({
      ...j,
      // pg devuelve la fecha como timestamp ISO; el input date solo acepta YYYY-MM-DD
      fechaNacimiento: j.fechaNacimiento ? String(j.fechaNacimiento).slice(0, 10) : '',
      categoriaId: String(j.categoriaId),
      crearAcceso: !!j.accesoPadre,
      accesoUsuario: j.accesoPadre || '',
      accesoPassword: '',
      quitarAcceso: false,
    });
    setEditandoId(j.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelar = () => {
    resetFormulario();
  };

  const filtrados = jugadores.filter((j) => {
    const texto = `${j.nombre} ${j.apellido} ${j.documento}`.toLowerCase();
    return (
      texto.includes(buscar.toLowerCase()) &&
      (filtroCategoria === '' || j.categoriaId === Number(filtroCategoria)) &&
      (filtroEstado === '' || j.activo === (filtroEstado === 'activo'))
    );
  });

  const pag = usePaginacion(filtrados.length);

  return (
    <>
      <div className="row g-4 mb-3">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 fw-bold border-bottom">
              <i className="bi bi-person-arms-up text-primary me-2"></i>
              {editandoId ? 'Editar Jugador' : 'Ficha de Jugador'}
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  {/* Foto del jugador: input oculto, se abre al clicar el avatar */}
                  <div className="col-12 d-flex align-items-center gap-3 mb-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="d-none"
                      accept="image/*"
                      onChange={handleFoto}
                    />
                    <div
                      className="position-relative"
                      style={{ cursor: 'pointer' }}
                      title={form.foto ? 'Cambiar foto' : 'Agregar foto'}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Avatar jugador={form} size={72} />
                      <span
                        className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center border border-white"
                        style={{ width: '24px', height: '24px' }}
                      >
                        <i className="bi bi-camera-fill" style={{ fontSize: '11px' }}></i>
                      </span>
                    </div>
                    <div>
                      <div className="small fw-semibold text-secondary mb-1">Foto del jugador</div>
                      {form.foto ? (
                        <div className="d-flex gap-3 small">
                          <a href="#" onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}>
                            Cambiar
                          </a>
                          <a
                            href="#"
                            className="text-danger"
                            onClick={(e) => {
                              e.preventDefault();
                              setForm((prev) => ({ ...prev, foto: null }));
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                          >
                            Quitar
                          </a>
                        </div>
                      ) : (
                        <a
                          href="#"
                          className="small"
                          onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                        >
                          Agregar foto
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label small fw-semibold text-secondary">Nombre *</label>
                    <input type="text" name="nombre" className="form-control" value={form.nombre} onChange={handleChange} placeholder="Ej: Thiago" />
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label small fw-semibold text-secondary">Apellido *</label>
                    <input type="text" name="apellido" className="form-control" value={form.apellido} onChange={handleChange} placeholder="Ej: Vera" />
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="form-label small fw-semibold text-secondary">Documento / CI</label>
                    <input type="text" name="documento" className="form-control" value={form.documento} onChange={handleChange} placeholder="Ej: 5123456" />
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="form-label small fw-semibold text-secondary">Fecha de Nacimiento</label>
                    <input type="date" name="fechaNacimiento" className="form-control" value={form.fechaNacimiento} onChange={handleChange} />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-semibold text-secondary">Categoría *</label>
                    <select name="categoriaId" className="form-select" value={form.categoriaId} onChange={handleChange}>
                      <option value="">Seleccionar...</option>
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre} ({c.edadMin}-{c.edadMax} años)</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-semibold text-secondary">Tutor / Padre-Madre</label>
                    <input type="text" name="tutor" className="form-control" value={form.tutor} onChange={handleChange} placeholder="Nombre del responsable" />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label small fw-semibold text-secondary">Teléfono del Tutor</label>
                    <input type="text" name="telefonoTutor" className="form-control" value={form.telefonoTutor} onChange={handleChange} placeholder="Ej: 0981-123456" />
                  </div>

                  {/* Acceso del padre al portal (asistencia + pagos) */}
                  <div className="col-12">
                    <div className="border rounded p-3 bg-light-subtle">
                      <div className="form-check form-switch mb-0">
                        <input
                          className="form-check-input" type="checkbox" id="accesoPadreCheck"
                          checked={form.crearAcceso}
                          onChange={(e) => setForm((prev) => ({
                            ...prev,
                            crearAcceso: e.target.checked,
                            accesoUsuario: e.target.checked && !prev.accesoUsuario ? (prev.documento || '') : prev.accesoUsuario,
                            quitarAcceso: false,
                          }))}
                        />
                        <label className="form-check-label small fw-semibold text-secondary" htmlFor="accesoPadreCheck">
                          <i className="bi bi-key me-1"></i>
                          {form.accesoPadre ? `Acceso del padre: ${form.accesoPadre}` : 'Dar acceso al portal del padre'}
                        </label>
                      </div>
                      {form.crearAcceso && (
                        <div className="row g-2 mt-1">
                          <div className="col-6 col-md-4">
                            <label className="form-label small fw-semibold text-secondary mb-1">Usuario</label>
                            <input
                              type="text" className="form-control form-control-sm"
                              value={form.accesoUsuario}
                              onChange={(e) => setForm((prev) => ({ ...prev, accesoUsuario: e.target.value }))}
                              placeholder="Ej: cédula del tutor"
                            />
                          </div>
                          <div className="col-6 col-md-4">
                            <label className="form-label small fw-semibold text-secondary mb-1">
                              Contraseña {form.accesoPadre ? '(vacía = sin cambio)' : '*'}
                            </label>
                            <input
                              type="text" className="form-control form-control-sm"
                              value={form.accesoPassword}
                              onChange={(e) => setForm((prev) => ({ ...prev, accesoPassword: e.target.value }))}
                              placeholder={form.accesoPadre ? 'Nueva contraseña' : 'Ej: ci o fecha nac.'}
                            />
                          </div>
                          {form.accesoPadre && (
                            <div className="col-12 col-md-4 d-flex align-items-end">
                              <button
                                type="button" className="btn btn-sm btn-outline-danger"
                                onClick={() => setForm((prev) => ({ ...prev, quitarAcceso: true, crearAcceso: false }))}
                              >
                                <i className="bi bi-trash me-1"></i>Quitar acceso
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {form.quitarAcceso && (
                        <div className="small text-danger mt-1">
                          <i className="bi bi-exclamation-triangle me-1"></i>
                          El acceso se eliminará al guardar.{' '}
                          <a href="#" onClick={(e) => { e.preventDefault(); setForm((prev) => ({ ...prev, quitarAcceso: false, crearAcceso: true })); }}>Deshacer</a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-12 d-flex align-items-center justify-content-between">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" name="activo" id="jugadorActivo" checked={form.activo} onChange={handleChange} />
                      <label className="form-check-label small fw-semibold text-secondary" htmlFor="jugadorActivo">Jugador activo</label>
                    </div>
                    <div className="d-flex gap-2">
                      {editandoId && (
                        <button type="button" className="btn btn-outline-secondary px-4" onClick={handleCancelar}>
                          Cancelar
                        </button>
                      )}
                      <button type="submit" className="btn btn-primary px-4 fw-medium">
                        {editandoId ? 'Guardar Cambios' : 'Registrar Jugador'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 border-bottom">
              <div className="row g-2 align-items-center">
                <div className="col-12 col-md-4 fw-bold">
                  <i className="bi bi-list-ul text-success me-2"></i> Listado de Jugadores
                  <span className="badge bg-secondary ms-2">{filtrados.length}</span>
                </div>
                <div className="col-12 col-md-8">
                  <div className="row g-2">
                    <div className="col-12 col-sm-5">
                      <input type="text" className="form-control form-control-sm" placeholder="Buscar por nombre o documento..." value={buscar} onChange={(e) => setBuscar(e.target.value)} />
                    </div>
                    <div className="col-6 col-sm-4">
                      <select className="form-select form-select-sm" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                        <option value="">Todas las categorías</option>
                        {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </div>
                    <div className="col-6 col-sm-3">
                      <select className="form-select form-select-sm" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                        <option value="">Todos</option>
                        <option value="activo">Activos</option>
                        <option value="inactivo">Inactivos</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body p-0 table-responsive">
              <table className="table table-sm table-hover align-middle m-0 table-striped text-nowrap">
                <thead className="table-light">
                  <tr>
                    <th className="px-3">Jugador</th>
                    <th>Documento</th>
                    <th>Categoría</th>
                    <th>Edad</th>
                    <th>Tutor / Teléfono</th>
                    <th>Estado</th>
                    <th className="px-3 text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-5">
                        No hay jugadores que coincidan con el filtro.
                      </td>
                    </tr>
                  ) : (
                    pag.cortar(filtrados).map((j) => (
                      <tr key={j.id}>
                        <td className="px-3 fw-semibold">
                          <div className="d-flex align-items-center gap-2">
                            <Avatar jugador={j} size={36} />
                            <span>{j.nombre} {j.apellido}</span>
                            {j.accesoPadre && <i className="bi bi-key-fill text-warning" title={`Acceso padre: ${j.accesoPadre}`}></i>}
                          </div>
                        </td>
                        <td>{j.documento || '-'}</td>
                        <td><span className="badge bg-primary-subtle text-primary">{categoriaNombre(j.categoriaId)}</span></td>
                        <td>{calcularEdad(j.fechaNacimiento)}</td>
                        <td>
                          <div className="small">{j.tutor || '-'}</div>
                          <div className="small text-muted">{j.telefonoTutor || ''}</div>
                        </td>
                        <td>
                          <span className={`badge ${j.activo ? 'bg-success' : 'bg-secondary'}`}>
                            {j.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-3 text-end">
                          <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEditar(j)} title="Editar">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={async () => { if (await confirmar(`¿Eliminar a ${j.nombre} ${j.apellido}?`)) await onDelete(j.id); }} title="Eliminar">
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Paginador
              pagina={pag.pagina}
              totalPaginas={pag.totalPaginas}
              onChange={pag.setPagina}
              porPagina={pag.porPagina}
              onPorPagina={pag.cambiarPorPagina}
              desde={pag.desde}
              hasta={pag.hasta}
              total={filtrados.length}
            />
          </div>
        </div>
      </div>
    </>
  );
};
