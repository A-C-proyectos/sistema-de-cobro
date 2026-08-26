/* ==========================================================================
   clientes.js — página de gestión de clientes (pages/clientes.html)
   ========================================================================== */

let filtroTexto = '';
let editandoId = null;

document.addEventListener('DOMContentLoaded', () => {
  Layout.inicializarLayout({ activo: 'clientes', titulo: 'Clientes', subtitulo: 'Directorio y historial de compras', dentroDePages: true });
  Modales.inicializarModalConfirmar();
  Helpers.inicializarCierreModales();

  pintarTabla();

  document.getElementById('buscar').addEventListener('input', Helpers.debounce((e) => {
    filtroTexto = e.target.value.trim().toLowerCase();
    pintarTabla();
  }, 200));

  document.getElementById('btn-nuevo-cliente').addEventListener('click', () => _abrirFormulario());
  document.getElementById('form-cliente').addEventListener('submit', _guardarFormulario);
});

function pintarTabla() {
  const clientes = Storage.obtenerClientes().filter((c) =>
    !filtroTexto || c.nombre.toLowerCase().includes(filtroTexto) || (c.telefono || '').includes(filtroTexto)
  );

  const tbody = document.getElementById('tabla-clientes');

  if (clientes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state__icon">👥</div><div class="empty-state__title">No hay clientes registrados</div><p>Agrega tu primer cliente para comenzar.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = clientes.map((c) => `
    <tr>
      <td class="cell-strong">${Helpers.escaparHTML(c.nombre)}</td>
      <td class="cell-mono">${Helpers.escaparHTML(c.telefono || '—')}</td>
      <td class="cell-muted">${Helpers.escaparHTML(c.correo || '—')}</td>
      <td class="cell-muted">${Helpers.escaparHTML(c.direccion || '—')}</td>
      <td class="cell-muted">${Formatters.formatearFecha(c.fechaRegistro)}</td>
      <td class="cell-actions">
        <button class="btn btn-outline btn-sm btn-historial" data-id="${c.id}">Historial</button>
        <button class="btn btn-outline btn-sm btn-editar" data-id="${c.id}">Editar</button>
        <button class="btn btn-danger btn-sm btn-eliminar" data-id="${c.id}">Eliminar</button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.btn-historial').forEach((b) => b.addEventListener('click', () => _verHistorial(b.dataset.id)));
  tbody.querySelectorAll('.btn-editar').forEach((b) => b.addEventListener('click', () => _abrirFormulario(b.dataset.id)));
  tbody.querySelectorAll('.btn-eliminar').forEach((b) => b.addEventListener('click', () => _confirmarEliminar(b.dataset.id)));
}

function _abrirFormulario(id = null) {
  editandoId = id;
  const form = document.getElementById('form-cliente');
  form.reset();
  Validators.aplicarErroresFormulario({});
  document.getElementById('titulo-modal-cliente').textContent = id ? 'Editar cliente' : 'Nuevo cliente';

  if (id) {
    const cliente = Storage.obtenerClientes().find((c) => c.id === id);
    if (!cliente) return;
    document.getElementById('campo-nombre').value = cliente.nombre;
    document.getElementById('campo-telefono').value = cliente.telefono || '';
    document.getElementById('campo-correo').value = cliente.correo || '';
    document.getElementById('campo-direccion').value = cliente.direccion || '';
  }

  Helpers.abrirModal('modal-cliente');
}

function _guardarFormulario(e) {
  e.preventDefault();
  const cliente = {
    nombre: document.getElementById('campo-nombre').value.trim(),
    telefono: document.getElementById('campo-telefono').value.trim(),
    correo: document.getElementById('campo-correo').value.trim(),
    direccion: document.getElementById('campo-direccion').value.trim(),
  };

  const { valido, errores } = Validators.validarCliente(cliente);
  if (!valido) {
    Validators.aplicarErroresFormulario(errores);
    return;
  }

  if (editandoId) {
    Storage.actualizarCliente(editandoId, cliente);
    Helpers.mostrarToast('✓ Cliente actualizado correctamente', 'success');
  } else {
    Storage.guardarCliente(cliente);
    Helpers.mostrarToast('✓ Cliente agregado correctamente', 'success');
  }

  Helpers.cerrarModal('modal-cliente');
  pintarTabla();
}

function _confirmarEliminar(id) {
  const cliente = Storage.obtenerClientes().find((c) => c.id === id);
  Helpers.confirmarAccion({
    titulo: 'Eliminar cliente',
    mensaje: `¿Deseas eliminar a "${cliente?.nombre}"? Esta acción no se puede deshacer.`,
    onConfirmar: () => {
      Storage.eliminarCliente(id);
      Helpers.mostrarToast('Cliente eliminado', 'info');
      pintarTabla();
    },
  });
}

function _verHistorial(id) {
  const cliente = Storage.obtenerClientes().find((c) => c.id === id);
  if (!cliente) return;
  const ventas = Storage.obtenerVentas().filter((v) => v.clienteId === id);

  document.getElementById('titulo-historial').textContent = `Historial de compras — ${cliente.nombre}`;

  const cont = document.getElementById('contenido-historial');
  if (ventas.length === 0) {
    cont.innerHTML = `<div class="empty-state"><div class="empty-state__icon">🧾</div><div class="empty-state__title">Este cliente aún no tiene compras registradas</div></div>`;
  } else {
    const totalGastado = ventas.reduce((acc, v) => acc + v.total, 0);
    cont.innerHTML = `
      <div class="alert alert-info mb-4">Total histórico: <strong>${Formatters.formatearMoneda(totalGastado)}</strong> en ${ventas.length} compra(s).</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th class="no-sort">Venta</th><th class="no-sort">Fecha</th><th class="no-sort">Productos</th><th class="no-sort">Total</th></tr></thead>
          <tbody>
            ${ventas.map((v) => `
              <tr>
                <td class="cell-mono">#${Helpers.escaparHTML(v.numero)}</td>
                <td>${Formatters.formatearFechaHora(v.fecha)}</td>
                <td class="cell-muted">${Helpers.escaparHTML(v.items.map((i) => i.nombre).join(', '))}</td>
                <td class="cell-mono cell-strong">${Formatters.formatearMoneda(v.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  Helpers.abrirModal('modal-historial');
}
