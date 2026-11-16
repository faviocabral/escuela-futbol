import Swal from 'sweetalert2';

// Toast rápido (éxito/info) — esquina superior, desaparece solo
export const toast = (mensaje, icon = 'success') =>
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title: mensaje,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });

// Aviso de validación o información — toast con más tiempo de lectura
export const aviso = (mensaje, icon = 'warning') =>
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title: mensaje,
    showConfirmButton: false,
    timer: 4500,
    timerProgressBar: true,
  });

// Confirmación (reemplaza confirm()) — devuelve Promise<boolean>
export const confirmar = async (titulo, texto = 'Esta acción no se puede deshacer.') => {
  const res = await Swal.fire({
    icon: 'question',
    title: titulo,
    text: texto,
    showCancelButton: true,
    confirmButtonText: 'Sí, confirmar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
  });
  return res.isConfirmed;
};
