/* ==========================================================================
   inventario.js — página de control de inventario (pages/inventario.html)
   ========================================================================== */

let filtroTexto = '';
let filtroEstadoStock = 'todos';

document.addEventListener('DOMContentLoaded', () => {
  Layout.inicializarLayout({ activo: 'inventario', titulo: 'Inventario', subtitulo: 'Control de stock y movimientos', dentroDePages: true });
  Modales.inicializarModalConfirmar();
  Helpers.inicializarCierreModales();

  pintarTablaStock();
  Movimientos.pintarTablaMovimientos('tabla-movimientos');

  Movimientos.inicializarModalMovimiento({
    onRegistrar: () => {
      pintarTablaStock();
      Movimientos.pintarTablaMovimientos('tabla-movimientos');
    },
  });

  document.getElementById('buscar').addEventListener('input', Helpers.debounce((e) => {
    filtroTexto = e.target.value.trim().toLowerCase();
    pintarTablaStock();
  }, 200));

  document.querySelectorAll('.chip[data-estado]').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-estado]').forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      filtroEstadoStock = chip.dataset.estado;
      pintarTablaStock();
    });
  });

  document.getElementById('btn-registrar-entrada').addEventListener('click', () => Movimientos.abrirModalMovimiento(null, 'entrada'));
  document.getElementById('btn-registrar-salida').addEventListener('click', () => Movimientos.abrirModalMovimiento(null, 'ajuste'));

  document.querySelectorAll('.tab-bar button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-bar button').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.add('hidden'));
      document.getElementById(btn.dataset.tab).classList.remove('hidden');
    });
  });
});

function _estadoStock(p) {
  if (p.stock === 0) return 'agotado';
  if (p.stock <= p.stockMinimo) return 'bajo';
  return 'normal';
}

function pintarTablaStock() {
  const proveedores = Storage.obtenerProveedores();
  const productos = Storage.obtenerProductos().filter((p) => {
    const coincideTexto = !filtroTexto || p.nombre.toLowerCase().includes(filtroTexto) || p.sku.toLowerCase().includes(filtroTexto);
    const coincideEstado = filtroEstadoStock === 'todos' || _estadoStock(p) === filtroEstadoStock;
    return coincideTexto && coincideEstado;
  });

  const tbody = document.getElementById('tabla-inventario');

  if (productos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-state__icon">📦</div><div class="empty-state__title">No se encontraron productos</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = productos.map((p) => {
    const proveedor = proveedores.find((pr) => pr.id === p.proveedorId);
    const estado = _estadoStock(p);
    const badge = estado === 'agotado'
      ? '<span class="badge badge-danger">Agotado</span>'
      : estado === 'bajo'
        ? '<span class="badge badge-warning">Stock bajo</span>'
        : '<span class="badge badge-success">Normal</span>';
    const pillClase = estado === 'agotado' ? 'is-out' : estado === 'bajo' ? 'is-low' : '';

    return `
      <tr>
        <td>${Helpers.esImagenDataURL(p.imagen) ? `<img class="cell-img" src="${p.imagen}" alt="${Helpers.escaparHTML(p.nombre)}">` : `<span style="font-size:1.3rem;">${Helpers.escaparHTML(p.imagen)}</span>`}</td>
        <td class="cell-strong">${Helpers.escaparHTML(p.nombre)}<div class="cell-muted" style="font-size:11px;">${Helpers.escaparHTML(p.sku)}</div></td>
        <td>${Helpers.escaparHTML(p.categoria)}</td>
        <td class="cell-muted">${Helpers.escaparHTML(proveedor ? proveedor.empresa : '—')}</td>
        <td class="stock-pill ${pillClase}">${Formatters.formatearCantidadUnidad(p.stock, p.unidad)}</td>
        <td class="cell-mono cell-muted">${Formatters.formatearCantidadUnidad(p.stockMinimo, p.unidad)}</td>
        <td>${badge}</td>
        <td class="cell-actions">
          <button class="btn btn-outline btn-sm btn-entrada" data-id="${p.id}">+ Entrada</button>
          <button class="btn btn-outline btn-sm btn-salida" data-id="${p.id}">− Salida</button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.btn-entrada').forEach((b) => b.addEventListener('click', () => Movimientos.abrirModalMovimiento(b.dataset.id, 'entrada')));
  tbody.querySelectorAll('.btn-salida').forEach((b) => b.addEventListener('click', () => Movimientos.abrirModalMovimiento(b.dataset.id, 'ajuste')));
}
