import { useState } from 'react';

// Paginación del lado del cliente para los listados del mockup.
// cortar(arr) devuelve solo los items de la página actual.
// porPagina cambia desde el selector (5/10/20); default 5 pensando en celular.
export const usePaginacion = (totalItems, porPaginaInicial = 5) => {
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(porPaginaInicial);

  const totalPaginas = Math.max(1, Math.ceil(totalItems / porPagina));
  const actual = Math.min(pagina, totalPaginas); // si el filtro achica la lista, no queda fuera de rango
  const desde = (actual - 1) * porPagina;

  const cambiarPorPagina = (n) => {
    setPorPagina(n);
    setPagina(1);
  };

  return {
    pagina: actual,
    setPagina,
    porPagina,
    cambiarPorPagina,
    totalPaginas,
    desde,
    hasta: Math.min(desde + porPagina, totalItems),
    cortar: (arr) => arr.slice(desde, desde + porPagina),
  };
};
