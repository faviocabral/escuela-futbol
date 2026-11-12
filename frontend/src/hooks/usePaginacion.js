import { useState } from 'react';

// Paginación del lado del cliente para los listados del mockup.
// cortar(arr) devuelve solo los items de la página actual.
export const usePaginacion = (totalItems, porPagina = 10) => {
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(totalItems / porPagina));
  const actual = Math.min(pagina, totalPaginas); // si el filtro achica la lista, no queda fuera de rango
  const desde = (actual - 1) * porPagina;

  return {
    pagina: actual,
    setPagina,
    totalPaginas,
    desde,
    hasta: Math.min(desde + porPagina, totalItems),
    cortar: (arr) => arr.slice(desde, desde + porPagina),
  };
};
