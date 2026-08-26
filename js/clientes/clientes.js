/* ==========================================================================
   clientes.js — página de gestión de clientes (pages/clientes.html)
   ========================================================================== */

import { inicializarLayout } from '../components/layout.js';
import { inicializarModalConfirmar } from '../components/modales.js';
import {
  obtenerClientes,
  guardarCliente,
  actualizarCliente,
  eliminarCliente,
  obtenerVentas,
} from '../utils/storage.js';
import { validarCliente, aplicarErroresFormulario } from '../utils/validators.js';
import { formatearFecha, formatearFechaHora, formatearMoneda } from '../utils/formatters.js';
import { mostrarToast, abrirModal, cerrarModal, confirmarAccion, escaparHTML, debounce, inicializarCierreModales } from '../utils/helpers.js';

let filtroTexto = '';
let editandoId = null;

document.addEventListener('DOMContentLoaded', () => {
  inicializarLayout({ activo: 'clientes', titulo: 'Clientes', subtitulo: 'Directorio y historial de compras', dentroDePages: true });
  inicializarModalConfirmar();
  inicializarCierreModales();

  pintarTabla();

  document.getElementById('buscar').addEventListener('input', debounce((e) => {
    filtroTexto = e.target.value.trim().toLowerCase();
    pintarTabla();
  }, 200));

  document.getElementById('btn-nuevo-cliente').addEventListener('click', () => _abrirFormulario());
  document.getElementById('form-cliente').addEventListener('submit', _guardarFormulario);
});

function pintarTabla() {
  const clientes = obtenerClientes().filter((c) =>
    !filtroTexto || c.nombre.toLowerCase().includes(filtroTexto) || (c.telefono || '').includes(filtroTexto)
  );

  const tbody = document.getElementById('tabla-clientes');

  if (clientes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state__icon">👥</div><div class="empty-state__title">No hay clientes registrados</div><p>Agrega tu primer cliente para comenzar.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = clientes.map((c) => `
    <tr>
      <td class="cell-strong">${escaparHTML(c.nombre)}</td>
      <td class="cell-mono">${escaparHTML(c.telefono || '—')}</td>
      <td class="cell-muted">${escaparHTML(c.correo || '—')}</td>
      <td class="cell-muted">${escaparHTML(c.direccion || '—')}</td>
      <td class="cell-muted">${formatearFecha(c.fechaRegistro)}</td>
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
  aplicarErroresFormulario({});
  document.getElementById('titulo-modal-cliente').textContent = id ? 'Editar cliente' : 'Nuevo cliente';

  if (id) {
    const cliente = obtenerClientes().find((c) => c.id === id);
    if (!cliente) return;
    document.getElementById('campo-nombre').value = cliente.nombre;
    document.getElementById('campo-telefono').value = cliente.telefono || '';
    document.getElementById('campo-correo').value = cliente.correo || '';
    document.getElementById('campo-direccion').value = cliente.direccion || '';
  }

  abrirModal('modal-cliente');
}

function _guardarFormulario(e) {
  e.preventDefault();
  const cliente = {
    nombre: document.getElementById('campo-nombre').value.trim(),
    telefono: document.getElementById('campo-telefono').value.trim(),
    correo: document.getElementById('campo-correo').value.trim(),
    direccion: document.getElementById('campo-direccion').value.trim(),
  };

  const { valido, errores } = validarCliente(cliente);
  if (!valido) {
    aplicarErroresFormulario(errores);
    return;
  }

  if (editandoId) {
    actualizarCliente(editandoId, cliente);
    mostrarToast('✓ Cliente actualizado correctamente', 'success');
  } else {
    guardarCliente(cliente);
    mostrarToast('✓ Cliente agregado correctamente', 'success');
  }

  cerrarModal('modal-cliente');
  pintarTabla();
}

function _confirmarEliminar(id) {
  const cliente = obtenerClientes().find((c) => c.id === id);
  confirmarAccion({
    titulo: 'Eliminar cliente',
    mensaje: `¿Deseas eliminar a "${cliente?.nombre}"? Esta acción no se puede deshacer.`,
    onConfirmar: () => {
      eliminarCliente(id);
      mostrarToast('Cliente eliminado', 'info');
      pintarTabla();
    },
  });
}

function _verHistorial(id) {
  const cliente = obtenerClientes().find((c) => c.id === id);
  if (!cliente) return;
  const ventas = obtenerVentas().filter((v) => v.clienteId === id);

  document.getElementById('titulo-historial').textContent = `Historial de compras — ${cliente.nombre}`;

  const cont = document.getElementById('contenido-historial');
  if (ventas.length === 0) {
    cont.innerHTML = `<div class="empty-state"><div class="empty-state__icon">🧾</div><div class="empty-state__title">Este cliente aún no tiene compras registradas</div></div>`;
  } else {
    const totalGastado = ventas.reduce((acc, v) => acc + v.total, 0);
    cont.innerHTML = `
      <div class="alert alert-info mb-4">Total histórico: <strong>${formatearMoneda(totalGastado)}</strong> en ${ventas.length} compra(s).</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th class="no-sort">Venta</th><th class="no-sort">Fecha</th><th class="no-sort">Productos</th><th class="no-sort">Total</th></tr></thead>
          <tbody>
            ${ventas.map((v) => `
              <tr>
                <td class="cell-mono">#${escaparHTML(v.numero)}</td>
                <td>${formatearFechaHora(v.fecha)}</td>
                <td class="cell-muted">${escaparHTML(v.items.map((i) => i.nombre).join(', '))}</td>
                <td class="cell-mono cell-strong">${formatearMoneda(v.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  abrirModal('modal-historial');
}
