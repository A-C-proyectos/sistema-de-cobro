/* ==========================================================================
   movimientos.js — registro y listado de movimientos de inventario
   ========================================================================== */

const TIPOS_QUE_RESTAN = ['salida', 'dano', 'vencido', 'merma'];
const TIPOS_QUE_SUMAN = ['entrada', 'devolucion'];

let alRegistrar = () => {};

function inicializarModalMovimiento({ onRegistrar }) {
  alRegistrar = onRegistrar || (() => {});

  const selProducto = document.getElementById('mov-producto');
  const productos = Storage.obtenerProductos();
  selProducto.innerHTML = productos.map((p) => `<option value="${p.id}">${Helpers.escaparHTML(p.nombre)} (${Formatters.formatearCantidadUnidad(p.stock, p.unidad)} disp.)</option>`).join('');

  document.getElementById('form-movimiento').addEventListener('submit', _registrarMovimiento);
}

function abrirModalMovimiento(productoId = null, tipo = 'entrada') {
  const form = document.getElementById('form-movimiento');
  form.reset();
  Validators.aplicarErroresFormulario({}, 'mov-');
  document.getElementById('mov-tipo').value = tipo;
  if (productoId) document.getElementById('mov-producto').value = productoId;
  Helpers.abrirModal('modal-movimiento');
}

function _registrarMovimiento(e) {
  e.preventDefault();

  const movimiento = {
    productoId: document.getElementById('mov-producto').value,
    cantidad: Number(document.getElementById('mov-cantidad').value),
    tipo: document.getElementById('mov-tipo').value,
    motivo: document.getElementById('mov-motivo').value.trim(),
  };

  const { valido, errores } = Validators.validarMovimiento(movimiento);
  if (!valido) {
    Validators.aplicarErroresFormulario(errores, 'mov-');
    return;
  }

  const producto = Storage.obtenerProductoPorId(movimiento.productoId);
  if (!producto) return;

  const resta = TIPOS_QUE_RESTAN.includes(movimiento.tipo);
  if (resta) {
    const check = Validators.validarStockDisponible(producto.stock, movimiento.cantidad);
    if (!check.valido) {
      Validators.aplicarErroresFormulario({ cantidad: check.mensaje }, 'mov-');
      return;
    }
  }

  const config = Storage.obtenerConfig();
  const delta = resta ? -movimiento.cantidad : movimiento.cantidad;
  Storage.ajustarStockProducto(producto.id, delta);

  Storage.guardarMovimiento({
    productoId: producto.id,
    productoNombre: producto.nombre,
    cantidad: movimiento.cantidad,
    unidad: producto.unidad,
    tipo: movimiento.tipo,
    motivo: movimiento.motivo,
    usuario: config.empleadoActual,
  });

  Helpers.cerrarModal('modal-movimiento');
  Helpers.mostrarToast(`✓ Movimiento de ${Formatters.etiquetaMovimiento(movimiento.tipo).toLowerCase()} registrado`, 'success');
  alRegistrar();
}

function pintarTablaMovimientos(contenedorId, limite = null) {
  let movimientos = Storage.obtenerMovimientos();
  if (limite) movimientos = movimientos.slice(0, limite);
  const tbody = document.getElementById(contenedorId);

  if (movimientos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state__icon">📋</div><div class="empty-state__title">Sin movimientos registrados</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = movimientos.map((m) => `
    <tr>
      <td>${Formatters.formatearFechaHora(m.fecha)}</td>
      <td class="cell-strong">${Helpers.escaparHTML(m.productoNombre)}</td>
      <td><span class="movement-type ${m.tipo}">${Formatters.etiquetaMovimiento(m.tipo)}</span></td>
      <td class="cell-mono">${Formatters.formatearCantidadUnidad(m.cantidad, m.unidad)}</td>
      <td>${Helpers.escaparHTML(m.motivo)}</td>
      <td class="cell-muted">${Helpers.escaparHTML(m.usuario)}</td>
    </tr>
  `).join('');
}

window.Movimientos = { inicializarModalMovimiento, abrirModalMovimiento, pintarTablaMovimientos };
