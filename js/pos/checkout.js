/* ==========================================================================
   checkout.js — modal de cobro, cálculo de cambio, registro de venta y recibo
   ========================================================================== */

import * as carrito from './carrito.js';
import {
  guardarVenta,
  ajustarStockProducto,
  guardarMovimiento,
  obtenerProductoPorId,
  obtenerConfig,
  obtenerClientePorId,
} from '../utils/storage.js';
import { validarStockDisponible, validarEfectivoSuficiente } from '../utils/validators.js';
import { mostrarToast, abrirModal, cerrarModal, escaparHTML, descargarArchivo } from '../utils/helpers.js';
import { formatearMoneda, formatearFechaHora, etiquetaMetodoPago, formatearCantidadUnidad, construirTextoRecibo } from '../utils/formatters.js';

let metodoSeleccionado = 'efectivo';
let onVentaCompletada = () => {};
let ventaActualParaRecibo = null;

export function inicializarCheckout({ alCompletarVenta }) {
  onVentaCompletada = alCompletarVenta || (() => {});

  document.querySelectorAll('.payment-method').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.payment-method').forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      metodoSeleccionado = btn.dataset.metodo;
      document.getElementById('bloque-efectivo').classList.toggle('hidden', metodoSeleccionado !== 'efectivo');
      _recalcularCambio();
    });
  });

  document.getElementById('input-efectivo-recibido')?.addEventListener('input', _recalcularCambio);
  document.getElementById('btn-confirmar-pago')?.addEventListener('click', _confirmarVenta);
  document.getElementById('btn-nueva-venta')?.addEventListener('click', () => {
    cerrarModal('modal-recibo');
  });
  document.getElementById('btn-imprimir-recibo')?.addEventListener('click', () => window.print());
  document.getElementById('btn-descargar-recibo')?.addEventListener('click', () => {
    if (!ventaActualParaRecibo) return;
    const nombreArchivo = `factura-${ventaActualParaRecibo.numero}.txt`;
    const cliente = ventaActualParaRecibo.clienteId ? obtenerClientePorId(ventaActualParaRecibo.clienteId) : null;
    const texto = construirTextoRecibo(ventaActualParaRecibo, obtenerConfig(), cliente);
    descargarArchivo(nombreArchivo, texto, 'text/plain');
    mostrarToast(`✓ Factura descargada: ${nombreArchivo}`, 'success');
  });
}

export function abrirCheckout() {
  if (carrito.carritoVacio()) {
    mostrarToast('Agrega al menos un producto al carrito antes de cobrar.', 'warning');
    return;
  }

  metodoSeleccionado = 'efectivo';
  document.querySelectorAll('.payment-method').forEach((b, i) => b.classList.toggle('is-selected', i === 0));
  document.getElementById('bloque-efectivo').classList.remove('hidden');

  const totales = carrito.calcularTotales();
  document.getElementById('checkout-total-valor').textContent = formatearMoneda(totales.total);
  const inputEfectivo = document.getElementById('input-efectivo-recibido');
  inputEfectivo.value = '';
  document.getElementById('checkout-cambio').classList.add('hidden');

  abrirModal('modal-checkout');
  setTimeout(() => inputEfectivo.focus(), 150);
}

function _recalcularCambio() {
  const totales = carrito.calcularTotales();
  const cambioEl = document.getElementById('checkout-cambio');
  const btnConfirmar = document.getElementById('btn-confirmar-pago');

  if (metodoSeleccionado !== 'efectivo') {
    cambioEl.classList.add('hidden');
    btnConfirmar.disabled = false;
    return;
  }

  const recibido = Number(document.getElementById('input-efectivo-recibido').value) || 0;
  cambioEl.classList.remove('hidden');

  if (!validarEfectivoSuficiente(totales.total, recibido)) {
    cambioEl.classList.add('is-invalid');
    cambioEl.innerHTML = `<span>Falta por cubrir</span><span>${formatearMoneda(totales.total - recibido)}</span>`;
    btnConfirmar.disabled = true;
  } else {
    cambioEl.classList.remove('is-invalid');
    const cambio = Math.round((recibido - totales.total) * 100) / 100;
    cambioEl.innerHTML = `<span>Cambio a entregar</span><span>${formatearMoneda(cambio)}</span>`;
    btnConfirmar.disabled = false;
  }
}

function _confirmarVenta() {
  const items = carrito.obtenerItems();

  // Revalidar stock disponible justo antes de confirmar (por si cambió).
  for (const item of items) {
    const producto = obtenerProductoPorId(item.productoId);
    if (!producto) continue;
    const check = validarStockDisponible(producto.stock, item.cantidad);
    if (!check.valido) {
      mostrarToast(`${producto.nombre}: ${check.mensaje}`, 'danger', 4500);
      return;
    }
  }

  const totales = carrito.calcularTotales();
  const recibido = metodoSeleccionado === 'efectivo'
    ? Number(document.getElementById('input-efectivo-recibido').value) || 0
    : totales.total;

  if (metodoSeleccionado === 'efectivo' && !validarEfectivoSuficiente(totales.total, recibido)) {
    mostrarToast('El efectivo recibido es menor que el total. No se puede finalizar la venta.', 'danger');
    return;
  }

  const config = obtenerConfig();
  const cambio = metodoSeleccionado === 'efectivo' ? Math.round((recibido - totales.total) * 100) / 100 : 0;

  const venta = guardarVenta({
    clienteId: carrito.obtenerCliente(),
    empleado: config.empleadoActual,
    metodoPago: metodoSeleccionado,
    items: items.map((i) => ({
      productoId: i.productoId,
      nombre: i.nombre,
      cantidad: i.cantidad,
      unidad: i.unidad,
      precioUnitario: i.precioUnitario,
      subtotal: Math.round(i.precioUnitario * i.cantidad * 100) / 100,
    })),
    subtotal: totales.subtotal,
    descuento: totales.descuento,
    impuesto: totales.impuesto,
    total: totales.total,
    efectivoRecibido: recibido,
    cambio,
    estado: 'completada',
  });

  // Reducir inventario y registrar movimientos de salida.
  items.forEach((item) => {
    ajustarStockProducto(item.productoId, -item.cantidad);
    guardarMovimiento({
      productoId: item.productoId,
      productoNombre: item.nombre,
      cantidad: item.cantidad,
      unidad: item.unidad,
      tipo: 'salida',
      motivo: `Venta #${venta.numero}`,
      usuario: config.empleadoActual,
    });
  });

  cerrarModal('modal-checkout');
  mostrarToast(`Venta #${venta.numero} registrada correctamente`, 'success');
  _mostrarRecibo(venta);

  carrito.vaciarCarrito();
  onVentaCompletada();
}

function _mostrarRecibo(venta) {
  ventaActualParaRecibo = venta;
  const config = obtenerConfig();
  const cliente = venta.clienteId ? obtenerClientePorId(venta.clienteId) : null;

  const filasProductos = venta.items.map((i) => `
    <tr>
      <td>${escaparHTML(i.nombre)}</td>
      <td style="text-align:center;">${formatearCantidadUnidad(i.cantidad, i.unidad)}</td>
      <td style="text-align:right;">${formatearMoneda(i.subtotal)}</td>
    </tr>
  `).join('');

  document.getElementById('recibo-contenido').innerHTML = `
    <div class="receipt-title receipt__center">${escaparHTML(config.nombreNegocio.toUpperCase())}</div>
    <div class="receipt__center">================================</div>
    <div class="mt-2 receipt__center">Venta #${escaparHTML(venta.numero)}</div>
    <hr>
    <div class="receipt-row"><span>Fecha:</span><span>${formatearFechaHora(venta.fecha)}</span></div>
    <div class="receipt-row"><span>Cliente:</span><span>${escaparHTML(cliente ? cliente.nombre : 'Cliente ocasional')}</span></div>
    <div class="receipt-row"><span>Cajero:</span><span>${escaparHTML(venta.empleado)}</span></div>
    <hr>
    <table>
      <thead><tr><td>Producto</td><td style="text-align:center;">Cant.</td><td style="text-align:right;">Total</td></tr></thead>
      <tbody>${filasProductos}</tbody>
    </table>
    <hr>
    <div class="receipt-row"><span>Subtotal:</span><span>${formatearMoneda(venta.subtotal)}</span></div>
    <div class="receipt-row"><span>Descuento:</span><span>${formatearMoneda(venta.descuento)}</span></div>
    <div class="receipt-row"><span>Impuesto:</span><span>${formatearMoneda(venta.impuesto)}</span></div>
    <div class="receipt-row" style="font-weight:700; font-size:14px;"><span>TOTAL:</span><span>${formatearMoneda(venta.total)}</span></div>
    <hr>
    <div class="receipt-row"><span>Método de pago:</span><span>${etiquetaMetodoPago(venta.metodoPago)}</span></div>
    ${venta.metodoPago === 'efectivo' ? `
      <div class="receipt-row"><span>Recibido:</span><span>${formatearMoneda(venta.efectivoRecibido)}</span></div>
      <div class="receipt-row"><span>Cambio:</span><span>${formatearMoneda(venta.cambio)}</span></div>
    ` : ''}
    <div class="receipt__center mt-2">================================</div>
    <div class="receipt__center">¡Gracias por su compra!</div>
  `;

  abrirModal('modal-recibo');
}
