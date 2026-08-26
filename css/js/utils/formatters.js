/* ==========================================================================
   formatters.js — utilidades de formato (moneda, fecha, unidades)
   ========================================================================== */

const MONEDA = 'RD$';

function formatearMoneda(valor) {
  const numero = Number(valor) || 0;
  return `${MONEDA}${numero.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatearNumero(valor, decimales = 2) {
  return Number(valor).toLocaleString('es-DO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimales,
  });
}

function formatearFecha(fechaISO) {
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatearHora(fechaISO) {
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
}

function formatearFechaHora(fechaISO) {
  return `${formatearFecha(fechaISO)} · ${formatearHora(fechaISO)}`;
}

function formatearFechaRelativa(fechaISO) {
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

function etiquetaUnidad(unidad) {
  return ETIQUETAS_UNIDAD[unidad] || unidad;
}

function formatearCantidadUnidad(cantidad, unidad) {
  const cantidadFmt = Number.isInteger(cantidad) ? cantidad : formatearNumero(cantidad, 2);
  return `${cantidadFmt} ${etiquetaUnidad(unidad)}`;
}

function capitalizar(texto) {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const ETIQUETAS_METODO_PAGO = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  pago_movil: 'Pago móvil',
};

function etiquetaMetodoPago(metodo) {
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

function etiquetaMovimiento(tipo) {
  return ETIQUETAS_MOVIMIENTO[tipo] || capitalizar(tipo);
}

/**
 * Construye la versión en texto plano de una factura/comprobante de venta,
 * lista para descargarse como archivo .txt (ver helpers.js → descargarArchivo).
 */
function construirTextoRecibo(venta, config, cliente) {
  const linea = '='.repeat(32);
  const sep = '-'.repeat(32);
  let t = '';
  t += `${linea}\n${config.nombreNegocio.toUpperCase()}\n${linea}\n\n`;
  t += `Venta #${venta.numero}\n\n`;
  t += `Fecha: ${formatearFechaHora(venta.fecha)}\n`;
  t += `Cliente: ${cliente ? cliente.nombre : 'Cliente ocasional'}\n`;
  t += `Cajero: ${venta.empleado}\n\n`;
  t += `${sep}\nProducto              Cant.     Total\n${sep}\n`;
  venta.items.forEach((i) => {
    const nombre = i.nombre.slice(0, 20).padEnd(20);
    const cant = formatearCantidadUnidad(i.cantidad, i.unidad).padStart(8);
    const total = formatearMoneda(i.subtotal).padStart(10);
    t += `${nombre}${cant}${total}\n`;
  });
  t += `${sep}\n\n`;
  t += `Subtotal:       ${formatearMoneda(venta.subtotal)}\n`;
  t += `Descuento:      ${formatearMoneda(venta.descuento)}\n`;
  t += `Impuesto:       ${formatearMoneda(venta.impuesto)}\n`;
  t += `TOTAL:          ${formatearMoneda(venta.total)}\n\n`;
  t += `Método de pago: ${etiquetaMetodoPago(venta.metodoPago)}\n`;
  if (venta.metodoPago === 'efectivo') {
    t += `Recibido:       ${formatearMoneda(venta.efectivoRecibido)}\n`;
    t += `Cambio:         ${formatearMoneda(venta.cambio)}\n`;
  }
  t += `\n${linea}\n      ¡Gracias por su compra!\n${linea}\n`;
  return t;
}

window.Formatters = {
  formatearMoneda,
  formatearNumero,
  formatearFecha,
  formatearHora,
  formatearFechaHora,
  formatearFechaRelativa,
  etiquetaUnidad,
  formatearCantidadUnidad,
  capitalizar,
  etiquetaMetodoPago,
  etiquetaMovimiento,
  construirTextoRecibo,
};
