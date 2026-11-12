import React, { useState } from 'react';
// 1. IMPORTAR LA LIBRERÍA
import Select from 'react-select';

export const FacturasView = ({ clientes }) => {
  const [selectedCliente, setSelectedCliente] = useState(null); // Ahora guarda un objeto {value, label}
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => setSelectedFiles(Array.from(e.target.files));

  // 2. TRANSFORMAR EL ARRAY DE CLIENTES AL FORMATO QUE BUSCA REACT-SELECT { value, label }
  const clientesOptions = clientes.map(c => ({
    value: c.id,
    label: `${c.nombre} (${c.ruc})`
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validamos usando el .value del objeto seleccionado
    if (!selectedCliente) return alert('Por favor, selecciona el cliente al que pertenecen estas facturas.');
    if (selectedFiles.length === 0) return alert('Selecciona al menos una imagen de factura.');

    setLoading(true);
    const formData = new FormData();
    
    // Adjuntamos el ID del cliente extraído del select
    formData.append('clienteId', selectedCliente.value);
    selectedFiles.forEach((file) => formData.append('images', file));

    try {
      const response = await fetch('https://tu-backend.com', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Error en el servidor');
      const data = await response.json();
      
      const clienteAsociado = clientes.find(c => c.id === selectedCliente.value);
      const newRecords = (Array.isArray(data) ? data : [data]).map(record => ({
        ...record,
        clienteNombre: clienteAsociado ? clienteAsociado.nombre : 'Desconocido'
      }));

      setRecords((prev) => [...newRecords, ...prev]);
      setSelectedFiles([]);
      setSelectedCliente(null); // Limpiar selección
      e.target.reset();
      alert('Facturas cargadas y asociadas correctamente');
    } catch (error) {
      console.error(error);
      alert('Error de conexión con la API');
    } finally {
      setLoading(false);
    }
  };

  // 3. ESTILOS PERSONALIZADOS PARA QUE CALCE PERFECTO CON BOOTSTRAP 5 Y ADMINLTE
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#86b7fe' : '#dee2e6',
      boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : 'none',
      '&:hover': { borderColor: '#86b7fe' },
      padding: '2px',
      borderRadius: '0.375rem'
    })
  };

  return (
    <>
        <div className="row g-4 mb-3">
            {/* Formulario de Carga */}
            <div className="col-12 col-lg-12">
                <div className="card shadow-sm border-0">
                <div className="card-header bg-white py-3 fw-bold border-bottom">
                    <i className="bi bi-file-earmark-arrow-up text-primary me-2"></i> Cargar Facturas
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-6 ">
                                {/* REEMPLAZO DEL DESPLEGABLE CON BUSCADOR */}
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-secondary">Asignar a Cliente</label>
                                    <Select
                                    options={clientesOptions}
                                    value={selectedCliente}
                                    onChange={(option) => setSelectedCliente(option)}
                                    placeholder="Escribe para buscar cliente..."
                                    noOptionsMessage={() => "No se encontraron clientes"}
                                    isClearable={true} // Permite borrar la selección con una 'X'
                                    isDisabled={loading || clientes.length === 0}
                                    styles={customStyles}
                                    />
                                    {clientes.length === 0 && (
                                    <div className="form-text text-danger small mt-1">
                                        * Debes registrar un cliente primero en la sección de Clientes.
                                    </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-6 ">
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-secondary">Archivos de Factura (Imágenes)</label>
                                    <input 
                                    type="file" className="form-control" multiple accept="image/*" 
                                    onChange={handleFileChange} disabled={loading || clientes.length === 0}
                                    />
                                </div>
                            </div>

                        </div>
                        <div className="row g-4" style={{ marginTop: '1px' }}>
                            <div className="col-6 mt-0"></div>
                            <div className="col-6 mt-0">
                                <button type="submit" className="btn btn-success w-100 fw-medium" disabled={loading || clientes.length === 0}>
                                    {loading ? 'Procesando en API...' : 'Subir Facturas'}
                                </button>
                            </div>

                        </div>
                    </form>
                </div>
                </div>
            </div>            
        </div>
        <div className="row g-4">
        {/* Historial de Facturas Procesadas (Queda igual a como lo tenías) */}
        <div className="col-12 col-lg-12">
            <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 fw-bold border-bottom">
                <i className="bi bi-receipt text-success me-2"></i> Lector de Facturas Registradas (JSON)
            </div>
            <div className="card-body p-0 table-responsive">
                <table className="table table-hover align-middle m-0 table-striped">
                <thead className="table-light">
                    <tr>
                    <th className="px-3" style={{ width: '12%' }}>ID</th>
                    <th>Cliente Vinculado</th>
                    <th>Preview</th>
                    <th>Nombre Documento</th>
                    <th className="px-3" style={{ width: '15%' }}>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {records.length === 0 ? (
                    <tr>
                        <td colSpan="5" className="text-center text-muted py-5">
                        No hay facturas analizadas en esta sesión de trabajo.
                        </td>
                    </tr>
                    ) : (
                    records.map((record, index) => (
                        <tr key={record.id || index}>
                        <td className="px-3 text-secondary font-monospace">#{record.id || 'N/A'}</td>
                        <td className="fw-semibold text-primary">{record.clienteNombre}</td>
                        <td>
                            {record.url ? (
                            <img src={record.url} alt="factura" className="img-thumbnail" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                            ) : 'N/A'}
                        </td>
                        <td className="text-truncate" style={{ maxWidth: '180px' }}>{record.name || 'factura_img.png'}</td>
                        <td className="px-3">
                            {record.url && (
                            <a href={record.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary w-100 py-1">
                                Ver URL
                            </a>
                            )}
                        </td>
                        </tr>
                    ))
                    )}
                </tbody>
                </table>
            </div>
            </div>
        </div>
        </div>
    </>
  );
};
