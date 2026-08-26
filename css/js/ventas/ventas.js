/* ==========================================================================
   ventas.js — página de historial de ventas (pages/ventas.html)
   ========================================================================== */

let filtroTexto = '';
let filtroMetodo = 'todos';
let filtroFecha = '';
let ventaActualParaRecibo = null;

document.addEventListener('DOMContentLoaded', () => {
  Layout.inicializarLayout({ activo: 'ventas', titulo: 'Ventas', subtitulo: 'Historial completo de ventas', dentroDePages: true });
  Modales.inicializarModalConfirmar();
  Helpers.inicializarCierreModales();

  pintarTabla();

  document.getElementById('buscar').addEventListener('input', Helpers.debounce((e) => {
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
    const cliente = Storage.obtenerClientes().find((c) => c.id === ventaActualParaRecibo.clienteId);
    const texto = Formatters.construirTextoRecibo(ventaActualParaRecibo, Storage.obtenerConfig(), cliente);
    const nombreArchivo = `factura-${ventaActualParaRecibo.numero}.txt`;
    Helpers.descargarArchivo(nombreArchivo, texto, 'text/plain');
    Helpers.mostrarToast(`✓ Factura descargada: ${nombreArchivo}`, 'success');
  });
});

function pintarTabla() {
  const clientes = Storage.obtenerClientes();
  let ventas = Storage.obtenerVentas().filter((v) => {
    const cliente = clientes.find((c) => c.id === v.clienteId);
    const nombreCliente = cliente ? cliente.nombre.toLowerCase() : 'cliente ocasional';
    const coincideTexto = !filtroTexto || v.numero.includes(filtroTexto) || nombreCliente.includes(filtroTexto);
    const coincideMetodo = filtroMetodo === 'todos' || v.metodoPago === filtroMetodo;
    const coincideFecha = !filtroFecha || new Date(v.fecha).toISOString().slice(0, 10) === filtroFecha;
    return coincideTexto && coincideMetodo && coincideFecha;
  });

  const resumen = document.getElementById('resumen-filtrado');
  const totalFiltrado = ventas.reduce((acc, v) => acc + v.total, 0);
  resumen.textContent = `${ventas.length} venta(s) · Total: ${Formatters.formatearMoneda(totalFiltrado)}`;

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
        <td class="cell-mono cell-strong">#${Helpers.escaparHTML(v.numero)}</td>
        <td>${Formatters.formatearFecha(v.fecha)}</td>
        <td class="cell-muted">${Formatters.formatearFechaHora(v.fecha).split('·')[1] || ''}</td>
        <td>${Helpers.escaparHTML(cliente ? cliente.nombre : 'Cliente ocasional')}</td>
        <td class="cell-muted">${Helpers.escaparHTML(v.items.map((i) => i.nombre).join(', '))}</td>
        <td>${Formatters.etiquetaMetodoPago(v.metodoPago)}</td>
        <td class="cell-mono cell-strong">${Formatters.formatearMoneda(v.total)}</td>
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
  const venta = Storage.obtenerVentas().find((v) => v.id === id);
  if (!venta) return;
  ventaActualParaRecibo = venta;
  const cliente = Storage.obtenerClientes().find((c) => c.id === venta.clienteId);
  const config = Storage.obtenerConfig();

  document.getElementById('recibo-contenido').innerHTML = `
    <div class="receipt-title receipt__center">${Helpers.escaparHTML(config.nombreNegocio.toUpperCase())}</div>
    <div class="receipt__center">================================</div>
    <div class="mt-2 receipt__center">Venta #${Helpers.escaparHTML(venta.numero)}</div>
    <hr>
    <div class="receipt-row"><span>Fecha:</span><span>${Formatters.formatearFechaHora(venta.fecha)}</span></div>
    <div class="receipt-row"><span>Cliente:</span><span>${Helpers.escaparHTML(cliente ? cliente.nombre : 'Cliente ocasional')}</span></div>
    <div class="receipt-row"><span>Cajero:</span><span>${Helpers.escaparHTML(venta.empleado)}</span></div>
    <hr>
    <table>
      <thead><tr><td>Producto</td><td style="text-align:center;">Cant.</td><td style="text-align:right;">Total</td></tr></thead>
      <tbody>
        ${venta.items.map((i) => `
          <tr>
            <td>${Helpers.escaparHTML(i.nombre)}</td>
            <td style="text-align:center;">${Formatters.formatearCantidadUnidad(i.cantidad, i.unidad)}</td>
            <td style="text-align:right;">${Formatters.formatearMoneda(i.subtotal)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <hr>
    <div class="receipt-row"><span>Subtotal:</span><span>${Formatters.formatearMoneda(venta.subtotal)}</span></div>
    <div class="receipt-row"><span>Descuento:</span><span>${Formatters.formatearMoneda(venta.descuento)}</span></div>
    <div class="receipt-row"><span>Impuesto:</span><span>${Formatters.formatearMoneda(venta.impuesto)}</span></div>
    <div class="receipt-row" style="font-weight:700; font-size:14px;"><span>TOTAL:</span><span>${Formatters.formatearMoneda(venta.total)}</span></div>
    <hr>
    <div class="receipt-row"><span>Método de pago:</span><span>${Formatters.etiquetaMetodoPago(venta.metodoPago)}</span></div>
    ${venta.metodoPago === 'efectivo' ? `
      <div class="receipt-row"><span>Recibido:</span><span>${Formatters.formatearMoneda(venta.efectivoRecibido)}</span></div>
      <div class="receipt-row"><span>Cambio:</span><span>${Formatters.formatearMoneda(venta.cambio)}</span></div>
    ` : ''}
    <div class="receipt__center mt-2">================================</div>
    <div class="receipt__center">¡Gracias por su compra!</div>
  `;

  Helpers.abrirModal('modal-detalle-venta');
}
