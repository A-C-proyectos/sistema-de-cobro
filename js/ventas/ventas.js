/* ==========================================================================
   ventas.js — página de historial de ventas (pages/ventas.html)
   ========================================================================== */

import { inicializarLayout } from '../components/layout.js';
import { inicializarModalConfirmar } from '../components/modales.js';
import { obtenerVentas, obtenerClientes, obtenerConfig } from '../utils/storage.js';
import { formatearFecha, formatearFechaHora, formatearMoneda, etiquetaMetodoPago, formatearCantidadUnidad, construirTextoRecibo } from '../utils/formatters.js';
import { mostrarToast, abrirModal, escaparHTML, debounce, inicializarCierreModales, descargarArchivo } from '../utils/helpers.js';

let filtroTexto = '';
let filtroMetodo = 'todos';
let filtroFecha = '';
let ventaActualParaRecibo = null;

document.addEventListener('DOMContentLoaded', () => {
  inicializarLayout({ activo: 'ventas', titulo: 'Ventas', subtitulo: 'Historial completo de ventas', dentroDePages: true });
  inicializarModalConfirmar();
  inicializarCierreModales();

  pintarTabla();

  document.getElementById('buscar').addEventListener('input', debounce((e) => {
    filtroTexto = e.target.value.trim().toLowerCase();
    pintarTabla();
  }, 200));

  document.getElementById('filtro-metodo').addEventListener('change', (e) => {
    filtroMetodo = e.target.value;
    pintarTabla();
  });

  document.getElementById('filtro-fecha').addEventListener('change', (e) => {
    filtroFecha = e.target.value;
    pintarTabla();
  });

  document.getElementById('btn-limpiar-filtros').addEventListener('click', () => {
    filtroTexto = ''; filtroMetodo = 'todos'; filtroFecha = '';
    document.getElementById('buscar').value = '';
    document.getElementById('filtro-metodo').value = 'todos';
    document.getElementById('filtro-fecha').value = '';
    pintarTabla();
  });

  document.getElementById('btn-imprimir-detalle').addEventListener('click', () => window.print());

  document.getElementById('btn-descargar-detalle').addEventListener('click', () => {
    if (!ventaActualParaRecibo) return;
    const cliente = obtenerClientes().find((c) => c.id === ventaActualParaRecibo.clienteId);
    const texto = construirTextoRecibo(ventaActualParaRecibo, obtenerConfig(), cliente);
    const nombreArchivo = `factura-${ventaActualParaRecibo.numero}.txt`;
    descargarArchivo(nombreArchivo, texto, 'text/plain');
    mostrarToast(`✓ Factura descargada: ${nombreArchivo}`, 'success');
  });
});

function pintarTabla() {
  const clientes = obtenerClientes();
  let ventas = obtenerVentas().filter((v) => {
    const cliente = clientes.find((c) => c.id === v.clienteId);
    const nombreCliente = cliente ? cliente.nombre.toLowerCase() : 'cliente ocasional';
    const coincideTexto = !filtroTexto || v.numero.includes(filtroTexto) || nombreCliente.includes(filtroTexto);
    const coincideMetodo = filtroMetodo === 'todos' || v.metodoPago === filtroMetodo;
    const coincideFecha = !filtroFecha || new Date(v.fecha).toISOString().slice(0, 10) === filtroFecha;
    return coincideTexto && coincideMetodo && coincideFecha;
  });

  const resumen = document.getElementById('resumen-filtrado');
  const totalFiltrado = ventas.reduce((acc, v) => acc + v.total, 0);
  resumen.textContent = `${ventas.length} venta(s) · Total: ${formatearMoneda(totalFiltrado)}`;

  const tbody = document.getElementById('tabla-ventas');

  if (ventas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-state__icon">🧾</div><div class="empty-state__title">No se encontraron ventas</div><p>Ajusta los filtros de búsqueda.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = ventas.map((v) => {
    const cliente = clientes.find((c) => c.id === v.clienteId);
    const estadoBadge = v.estado === 'completada'
      ? '<span class="badge badge-success">Completada</span>'
      : '<span class="badge badge-warning">Pendiente</span>';
    return `
      <tr>
        <td class="cell-mono cell-strong">#${escaparHTML(v.numero)}</td>
        <td>${formatearFecha(v.fecha)}</td>
        <td class="cell-muted">${formatearFechaHora(v.fecha).split('·')[1] || ''}</td>
        <td>${escaparHTML(cliente ? cliente.nombre : 'Cliente ocasional')}</td>
        <td class="cell-muted">${escaparHTML(v.items.map((i) => i.nombre).join(', '))}</td>
        <td>${etiquetaMetodoPago(v.metodoPago)}</td>
        <td class="cell-mono cell-strong">${formatearMoneda(v.total)}</td>
        <td>${estadoBadge}</td>
        <td class="cell-actions">
          <button class="btn btn-outline btn-sm btn-detalle" data-id="${v.id}">Ver</button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.btn-detalle').forEach((b) => b.addEventListener('click', () => _verDetalle(b.dataset.id)));
}

function _verDetalle(id) {
  const venta = obtenerVentas().find((v) => v.id === id);
  if (!venta) return;
  ventaActualParaRecibo = venta;
  const cliente = obtenerClientes().find((c) => c.id === venta.clienteId);
  const config = obtenerConfig();

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
      <tbody>
        ${venta.items.map((i) => `
          <tr>
            <td>${escaparHTML(i.nombre)}</td>
            <td style="text-align:center;">${formatearCantidadUnidad(i.cantidad, i.unidad)}</td>
            <td style="text-align:right;">${formatearMoneda(i.subtotal)}</td>
          </tr>
        `).join('')}
      </tbody>
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

  abrirModal('modal-detalle-venta');
}
