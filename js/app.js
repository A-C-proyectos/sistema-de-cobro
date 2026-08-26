/* ==========================================================================
   app.js — Dashboard principal (index.html)
   ========================================================================== */

import { inicializarLayout } from './components/layout.js';
import { inicializarModalConfirmar } from './components/modales.js';
import {
  asegurarDatosIniciales,
  obtenerProductos,
  obtenerVentas,
  obtenerClientes,
} from './utils/storage.js';
import { formatearMoneda, formatearFechaHora, etiquetaMetodoPago, formatearCantidadUnidad } from './utils/formatters.js';
import { escaparHTML, inicializarCierreModales } from './utils/helpers.js';

document.addEventListener('DOMContentLoaded', () => {
  asegurarDatosIniciales();
  inicializarLayout({ activo: 'dashboard', titulo: 'Dashboard', subtitulo: 'Resumen general del negocio' });
  inicializarModalConfirmar();
  inicializarCierreModales();

  pintarEstadisticas();
  pintarVentasRecientes();
  pintarStockBajo();
});

function pintarEstadisticas() {
  const productos = obtenerProductos();
  const ventas = obtenerVentas();
  const clientes = obtenerClientes();

  const hoy = new Date().toDateString();
  const ventasHoy = ventas.filter((v) => new Date(v.fecha).toDateString() === hoy);
  const totalVentasHoy = ventasHoy.reduce((acc, v) => acc + v.total, 0);

  const stockBajo = productos.filter((p) => p.stock > 0 && p.stock <= p.stockMinimo).length;
  const agotados = productos.filter((p) => p.stock === 0).length;

  const gananciaEstimada = ventas.reduce((acc, venta) => {
    const gananciaVenta = venta.items.reduce((accItem, item) => {
      const producto = productos.find((p) => p.id === item.productoId);
      if (!producto) return accItem;
      return accItem + (item.precioUnitario - producto.precioCompra) * item.cantidad;
    }, 0);
    return acc + gananciaVenta;
  }, 0);

  const tarjetas = [
    { label: 'Ventas del día', valor: formatearMoneda(totalVentasHoy), icono: '💵', color: 'var(--primary-color)' },
    { label: 'N.º de ventas hoy', valor: ventasHoy.length, icono: '🧾', color: 'var(--info-color)' },
    { label: 'Productos disponibles', valor: productos.filter((p) => p.stock > 0).length, icono: '📦', color: 'var(--success-color)' },
    { label: 'Stock bajo', valor: stockBajo, icono: '⚠️', color: 'var(--warning-color)' },
    { label: 'Agotados', valor: agotados, icono: '⛔', color: 'var(--danger-color)' },
    { label: 'Ganancia estimada', valor: formatearMoneda(gananciaEstimada), icono: '📈', color: 'var(--primary-color)' },
    { label: 'Clientes registrados', valor: clientes.length, icono: '👥', color: 'var(--info-color)' },
  ];

  const cont = document.getElementById('stat-grid');
  cont.innerHTML = tarjetas.map((t) => `
    <div class="stat-card" style="--stat-color:${t.color}">
      <span class="stat-card__icon">${t.icono}</span>
      <div class="stat-card__label">${t.label}</div>
      <div class="stat-card__value ${typeof t.valor === 'string' && t.valor.includes('RD$') ? 'mono' : ''}">${t.valor}</div>
    </div>
  `).join('');
}

function pintarVentasRecientes() {
  const ventas = obtenerVentas().slice(0, 8);
  const clientes = obtenerClientes();
  const tbody = document.getElementById('tabla-ventas-recientes');

  if (ventas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-state__icon">🧾</div><div class="empty-state__title">Aún no hay ventas registradas</div><p>Realiza tu primera venta desde el POS.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = ventas.map((v) => {
    const cliente = clientes.find((c) => c.id === v.clienteId);
    const estadoBadge = v.estado === 'completada'
      ? '<span class="badge badge-success">Completada</span>'
      : '<span class="badge badge-warning">Pendiente</span>';
    return `
      <tr>
        <td class="cell-mono">#${escaparHTML(v.numero)}</td>
        <td>${formatearFechaHora(v.fecha)}</td>
        <td>${escaparHTML(cliente ? cliente.nombre : 'Cliente ocasional')}</td>
        <td>${escaparHTML(v.empleado)}</td>
        <td>${etiquetaMetodoPago(v.metodoPago)}</td>
        <td class="cell-mono cell-strong">${formatearMoneda(v.total)}</td>
        <td>${estadoBadge}</td>
      </tr>
    `;
  }).join('');
}

function pintarStockBajo() {
  const productos = obtenerProductos()
    .filter((p) => p.stock <= p.stockMinimo)
    .sort((a, b) => a.stock - b.stock);
  const tbody = document.getElementById('tabla-stock-bajo');

  if (productos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><div class="empty-state__icon">✅</div><div class="empty-state__title">Todo el stock está en niveles normales</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = productos.map((p) => {
    const estado = p.stock === 0
      ? '<span class="badge badge-danger">Agotado</span>'
      : '<span class="badge badge-warning">Stock bajo</span>';
    return `
      <tr>
        <td class="cell-strong">${escaparHTML(p.imagen)} ${escaparHTML(p.nombre)}</td>
        <td class="cell-mono">${formatearCantidadUnidad(p.stock, p.unidad)}</td>
        <td class="cell-mono cell-muted">${formatearCantidadUnidad(p.stockMinimo, p.unidad)}</td>
        <td>${estado}</td>
      </tr>
    `;
  }).join('');
}
