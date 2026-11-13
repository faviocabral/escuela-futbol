import React, { useState } from 'react';
import { Paginador } from '../components/Paginador';
import { usePaginacion } from '../hooks/usePaginacion';
import { aviso, confirmar, toast } from '../utils/notify';

const FORM_VACIO = { nombre: '', edadMin: '', edadMax: '', entrenadorId: '' };

export const CategoriasView = ({ categorias, entrenadores, jugadores, onAdd, onUpdate, onDelete }) => {
  const [form, setForm] = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [buscar, setBuscar] = useState('');

  const entrenadorNombre = (id) => {
    const e = entrenadores.find((x) => x.id === Number(id));
    return e ? `${e.nombre} ${e.apellido}` : null;
  };

  const jugadoresEn = (categoriaId) => jugadores.filter((j) => j.categoriaId === categoriaId);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return aviso('El nombre de la categoría es obligatorio (Ej: Sub-7).');

    const registro = {
      ...form,
      edadMin: form.edadMin === '' ? null : Number(form.edadMin),
      edadMax: form.edadMax === '' ? null : Number(form.edadMax),
      entrenadorId: form.entrenadorId === '' ? null : Number(form.entrenadorId),
    };

    if (editandoId) {
      onUpdate({ ...registro, id: editandoId });
      setEditandoId(null);
      toast('Categoría actualizada');
    } else {
      onAdd(registro);
      toast('Categoría creada');
    }
    setForm(FORM_VACIO);
  };

  const handleEditar = (c) => {
    setForm({
      nombre: c.nombre,
      edadMin: c.edadMin ?? '',
      edadMax: c.edadMax ?? '',
      entrenadorId: c.entrenadorId ? String(c.entrenadorId) : '',
    });
    setEditandoId(c.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filtradas = categorias.filter((c) =>
    c.nombre.toLowerCase().includes(buscar.toLowerCase())
  );

  const pag = usePaginacion(filtradas.length);

  return (
    <>
      <div className="row g-4 mb-3">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 fw-bold border-bottom">
              <i className="bi bi-diagram-3 text-primary me-2"></i>
              {editandoId ? 'Editar Categoría' : 'Nueva Categoría'}
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-12 col-md-3">
                    <label className="form-label small fw-semibold text-secondary">Nombre *</label>
                    <input type="text" name="nombre" className="form-control" value={form.nombre} onChange={handleChange} placeholder="Ej: Sub-7" />
                  </div>
                  <div className="col-6 col-md-2">
                    <label className="form-label small fw-semibold text-secondary">Edad mínima</label>
                    <input type="number" name="edadMin" className="form-control" value={form.edadMin} onChange={handleChange} min="3" max="20" placeholder="5" />
                  </div>
                  <div className="col-6 col-md-2">
                    <label className="form-label small fw-semibold text-secondary">Edad máxima</label>
                    <input type="number" name="edadMax" className="form-control" value={form.edadMax} onChange={handleChange} min="3" max="20" placeholder="7" />
                  </div>
                  <div className="col-12 col-md-5">
                    <label className="form-label small fw-semibold text-secondary">Entrenador a cargo</label>
                    <select name="entrenadorId" className="form-select" value={form.entrenadorId} onChange={handleChange}>
                      <option value="">Sin asignar</option>
                      {entrenadores.map((ent) => (
                        <option key={ent.id} value={ent.id}>{ent.nombre} {ent.apellido}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 d-flex justify-content-end gap-2">
                    {editandoId && (
                      <button type="button" className="btn btn-outline-secondary px-4" onClick={() => { setForm(FORM_VACIO); setEditandoId(null); }}>
                        Cancelar
                      </button>
                    )}
                    <button type="submit" className="btn btn-primary px-4 fw-medium">
                      {editandoId ? 'Guardar Cambios' : 'Crear Categoría'}
                    </button>
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
                  <i className="bi bi-list-ul text-success me-2"></i> Categorías
                  <span className="badge bg-secondary ms-2">{filtradas.length}</span>
                </div>
                <div className="col-12 col-md-4 ms-auto">
                  <input type="text" className="form-control form-control-sm" placeholder="Buscar categoría..." value={buscar} onChange={(e) => setBuscar(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="card-body p-0 table-responsive">
              <table className="table table-sm table-hover align-middle m-0 table-striped text-nowrap">
                <thead className="table-light">
                  <tr>
                    <th className="px-3">Categoría</th>
                    <th>Rango de edad</th>
                    <th>Entrenador</th>
                    <th>Jugadores</th>
                    <th className="px-3 text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-5">
                        No hay categorías registradas.
                      </td>
                    </tr>
                  ) : (
                    pag.cortar(filtradas).map((c) => {
                      const cant = jugadoresEn(c.id).length;
                      const ent = entrenadorNombre(c.entrenadorId);
                      return (
                        <tr key={c.id}>
                          <td className="px-3 fw-semibold">{c.nombre}</td>
                          <td>
                            {c.edadMin != null && c.edadMax != null
                              ? `${c.edadMin} a ${c.edadMax} años`
                              : '-'}
                          </td>
                          <td>{ent || <span className="text-muted small">Sin asignar</span>}</td>
                          <td>
                            <span className="badge bg-success-subtle text-success">
                              {cant} {cant === 1 ? 'jugador' : 'jugadores'}
                            </span>
                          </td>
                          <td className="px-3 text-end">
                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEditar(c)} title="Editar">
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={async () => { if (await confirmar(`¿Eliminar la categoría ${c.nombre}?`)) onDelete(c.id); }} title="Eliminar">
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })
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
              total={filtradas.length}
            />
          </div>
        </div>
      </div>
    </>
  );
};
