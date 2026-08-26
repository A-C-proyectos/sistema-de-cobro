/* ==========================================================================
   formatters.js — utilidades de formato (moneda, fecha, unidades)
   ========================================================================== */

const MONEDA = 'RD$';

export function formatearMoneda(valor) {
  const numero = Number(valor) || 0;
  return `${MONEDA}${numero.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatearNumero(valor, decimales = 2) {
  return Number(valor).toLocaleString('es-DO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimales,
  });
}

export function formatearFecha(fechaISO) {
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatearHora(fechaISO) {
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
}

export function formatearFechaHora(fechaISO) {
  return `${formatearFecha(fechaISO)} · ${formatearHora(fechaISO)}`;
}

export function formatearFechaRelativa(fechaISO) {
  const ahora = new Date();
  const fecha = new Date(fechaISO);
  const diffMs = ahora - fecha;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'justo ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `hace ${diffHoras} h`;
  const diffDias = Math.floor(diffHoras / 24);
  return `hace ${diffDias} d`;
}

const ETIQUETAS_UNIDAD = {
  unidad: 'unid.',
  kg: 'kg',
  lb: 'lb',
  '1/2kg': '½ kg',
  '1/2lb': '½ lb',
};

export function etiquetaUnidad(unidad) {
  return ETIQUETAS_UNIDAD[unidad] || unidad;
}

export function formatearCantidadUnidad(cantidad, unidad) {
  const cantidadFmt = Number.isInteger(cantidad) ? cantidad : formatearNumero(cantidad, 2);
  return `${cantidadFmt} ${etiquetaUnidad(unidad)}`;
}

export function capitalizar(texto) {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const ETIQUETAS_METODO_PAGO = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  pago_movil: 'Pago móvil',
};

export function etiquetaMetodoPago(metodo) {
  return ETIQUETAS_METODO_PAGO[metodo] || capitalizar(metodo);
}

const ETIQUETAS_MOVIMIENTO = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste',
  dano: 'Producto dañado',
  vencido: 'Producto vencido',
  devolucion: 'Devolución',
  merma: 'Merma',
};

export function etiquetaMovimiento(tipo) {
  return ETIQUETAS_MOVIMIENTO[tipo] || capitalizar(tipo);
}
