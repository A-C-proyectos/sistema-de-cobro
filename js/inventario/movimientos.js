/* ==========================================================================
   movimientos.js — registro y listado de movimientos de inventario
   ========================================================================== */

import {
  obtenerProductos,
  obtenerMovimientos,
  ajustarStockProducto,
  guardarMovimiento,
  obtenerConfig,
  obtenerProductoPorId,
} from '../utils/storage.js';
import { validarMovimiento, validarStockDisponible } from '../utils/validators.js';
import { formatearFechaHora, formatearCantidadUnidad, etiquetaMovimiento } from '../utils/formatters.js';
import { mostrarToast, abrirModal, cerrarModal, escaparHTML, aplicarErroresFormulario } from '../utils/helpers.js';

const TIPOS_QUE_RESTAN = ['salida', 'dano', 'vencido', 'merma'];
const TIPOS_QUE_SUMAN = ['entrada', 'devolucion'];

let alRegistrar = () => {};

export function inicializarModalMovimiento({ onRegistrar }) {
  alRegistrar = onRegistrar || (() => {});

  const selProducto = document.getElementById('mov-producto');
  const productos = obtenerProductos();
  selProducto.innerHTML = productos.map((p) => `<option value="${p.id}">${escaparHTML(p.nombre)} (${formatearCantidadUnidad(p.stock, p.unidad)} disp.)</option>`).join('');

  document.getElementById('form-movimiento').addEventListener('submit', _registrarMovimiento);
}

export function abrirModalMovimiento(productoId = null, tipo = 'entrada') {
  const form = document.getElementById('form-movimiento');
  form.reset();
  aplicarErroresFormulario({}, 'mov-');
  document.getElementById('mov-tipo').value = tipo;
  if (productoId) document.getElementById('mov-producto').value = productoId;
  abrirModal('modal-movimiento');
}

function _registrarMovimiento(e) {
  e.preventDefault();

  const movimiento = {
    productoId: document.getElementById('mov-producto').value,
    cantidad: Number(document.getElementById('mov-cantidad').value),
    tipo: document.getElementById('mov-tipo').value,
    motivo: document.getElementById('mov-motivo').value.trim(),
  };

  const { valido, errores } = validarMovimiento(movimiento);
  if (!valido) {
    aplicarErroresFormulario(errores, 'mov-');
    return;
  }

  const producto = obtenerProductoPorId(movimiento.productoId);
  if (!producto) return;

  const resta = TIPOS_QUE_RESTAN.includes(movimiento.tipo);
  if (resta) {
    const check = validarStockDisponible(producto.stock, movimiento.cantidad);
    if (!check.valido) {
      aplicarErroresFormulario({ cantidad: check.mensaje }, 'mov-');
      return;
    }
  }

  const config = obtenerConfig();
  const delta = resta ? -movimiento.cantidad : movimiento.cantidad;
  ajustarStockProducto(producto.id, delta);

  guardarMovimiento({
    productoId: producto.id,
    productoNombre: producto.nombre,
    cantidad: movimiento.cantidad,
    unidad: producto.unidad,
    tipo: movimiento.tipo,
    motivo: movimiento.motivo,
    usuario: config.empleadoActual,
  });

  cerrarModal('modal-movimiento');
  mostrarToast(`✓ Movimiento de ${etiquetaMovimiento(movimiento.tipo).toLowerCase()} registrado`, 'success');
  alRegistrar();
}

export function pintarTablaMovimientos(contenedorId, limite = null) {
  let movimientos = obtenerMovimientos();
  if (limite) movimientos = movimientos.slice(0, limite);
  const tbody = document.getElementById(contenedorId);

  if (movimientos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state__icon">📋</div><div class="empty-state__title">Sin movimientos registrados</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = movimientos.map((m) => `
    <tr>
      <td>${formatearFechaHora(m.fecha)}</td>
      <td class="cell-strong">${escaparHTML(m.productoNombre)}</td>
      <td><span class="movement-type ${m.tipo}">${etiquetaMovimiento(m.tipo)}</span></td>
      <td class="cell-mono">${formatearCantidadUnidad(m.cantidad, m.unidad)}</td>
      <td>${escaparHTML(m.motivo)}</td>
      <td class="cell-muted">${escaparHTML(m.usuario)}</td>
    </tr>
  `).join('');
}
