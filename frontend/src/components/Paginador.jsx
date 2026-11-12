import React from 'react';

// Pie de tabla con "Mostrando X–Y de Z" + botones de página.
export const Paginador = ({ pagina, totalPaginas, onChange, desde, hasta, total }) => {
  // Ventana de 5 páginas alrededor de la actual
  const inicio = Math.min(Math.max(0, pagina - 3), Math.max(0, totalPaginas - 5));
  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1).slice(inicio, inicio + 5);

  return (
    <div className="card-footer bg-white d-flex justify-content-between align-items-center border-top">
      <span className="text-muted small">
        Mostrando {total === 0 ? 0 : desde + 1}–{hasta} de {total}
      </span>
      {totalPaginas > 1 && (
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${pagina === 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => onChange(pagina - 1)} aria-label="Anterior">&laquo;</button>
          </li>
          {paginas.map((n) => (
            <li key={n} className={`page-item ${n === pagina ? 'active' : ''}`}>
              <button className="page-link" onClick={() => onChange(n)}>{n}</button>
            </li>
          ))}
          <li className={`page-item ${pagina === totalPaginas ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => onChange(pagina + 1)} aria-label="Siguiente">&raquo;</button>
          </li>
        </ul>
      )}
    </div>
  );
};
