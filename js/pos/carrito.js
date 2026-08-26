/* ==========================================================================
   carrito.js — estado y operaciones del carrito de compra
   ========================================================================== */

let items = [];
let clienteId = '';
let descuentoManual = 0; // monto fijo de descuento aplicado por el cajero
let impuestoPorcentaje = 0;

export function obtenerItems() {
  return items;
}

export function establecerImpuesto(porcentaje) {
  impuestoPorcentaje = Number(porcentaje) || 0;
}

export function agregarItem(producto, cantidad = 1) {
  const existente = items.find((i) => i.productoId === producto.id);
  if (existente) {
    existente.cantidad = Math.round((existente.cantidad + cantidad) * 1000) / 1000;
  } else {
    items.push({
      productoId: producto.id,
      nombre: producto.nombre,
      unidad: producto.unidad,
      precioUnitario: producto.precioVenta,
      cantidad,
      stockDisponible: producto.stock,
    });
  }
}

export function actualizarCantidad(productoId, cantidad) {
  const item = items.find((i) => i.productoId === productoId);
  if (!item) return;
  item.cantidad = Math.max(0, Math.round(cantidad * 1000) / 1000);
  if (item.cantidad === 0) eliminarItem(productoId);
}

export function eliminarItem(productoId) {
  items = items.filter((i) => i.productoId !== productoId);
}

export function vaciarCarrito() {
  items = [];
  clienteId = '';
  descuentoManual = 0;
}

export function establecerCliente(id) {
  clienteId = id;
}

export function obtenerCliente() {
  return clienteId;
}

export function establecerDescuento(monto) {
  descuentoManual = Math.max(0, Number(monto) || 0);
}

export function obtenerDescuento() {
  return descuentoManual;
}

export function calcularTotales() {
  const subtotal = items.reduce((acc, i) => acc + i.precioUnitario * i.cantidad, 0);
  const descuento = Math.min(descuentoManual, subtotal);
  const baseImpuesto = subtotal - descuento;
  const impuesto = Math.round(baseImpuesto * (impuestoPorcentaje / 100) * 100) / 100;
  const total = Math.round((baseImpuesto + impuesto) * 100) / 100;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    descuento: Math.round(descuento * 100) / 100,
    impuesto,
    total,
  };
}

export function carritoVacio() {
  return items.length === 0;
}
